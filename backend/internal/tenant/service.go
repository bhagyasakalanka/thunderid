/*
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package tenant

import (
	"context"
	"errors"
	"fmt"
	"os"
	"regexp"
	"strings"
	"sync"

	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"

	"github.com/thunder-id/thunderid/internal/system/bootstrap"
	"github.com/thunder-id/thunderid/internal/system/deployment"
	"github.com/thunder-id/thunderid/internal/system/importer"
	"github.com/thunder-id/thunderid/internal/system/log"
	"github.com/thunder-id/thunderid/internal/system/utils"
)

const tenantLoggerComponentName = "TenantService"

// deploymentIDPattern restricts a managed tenant's deployment id to a safe, portable character set.
var deploymentIDPattern = regexp.MustCompile(`^[A-Za-z0-9._:-]+$`)

// orgEnvPattern restricts an organization and environment name. It excludes the separator, so a
// deployment id always splits back into the pair it was built from.
var orgEnvPattern = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)

// orgEnvSeparator joins an organization and an environment into a deployment id.
const orgEnvSeparator = ":"

// deploymentIDFor builds the deployment id of an organization's environment.
func deploymentIDFor(org, env string) string {
	return org + orgEnvSeparator + env
}

// orgOf returns the organization a deployment id belongs to, or "" for an id that names none. Ids
// created before organizations, and the system tenant's own, have no organization.
func orgOf(deploymentID string) string {
	org, _, found := strings.Cut(deploymentID, orgEnvSeparator)
	if !found {
		return ""
	}
	return org
}

// BaselineSeeder copies an organization's existing configuration into a newly created tenant.
//
// It is supplied by the server rather than built here, because the configuration comes from the
// environment manager, which is hosted alongside this service rather than owned by it. Without one, a
// second environment is created empty and is populated by the first promotion into it.
type BaselineSeeder interface {
	SeedTenant(ctx context.Context, sourceDeploymentID, targetDeploymentID string) (*SeedSummary, error)
	// RegisterEnvironment records the tenant as an environment of its organization, so it takes part
	// in promotion without a second call to set it up.
	RegisterEnvironment(ctx context.Context, in RegisterEnvironmentInput) (*EnvironmentSummary, error)
}

// RegisterEnvironmentInput describes the promotion entry a new tenant is registered as.
type RegisterEnvironmentInput struct {
	// Name is the environment's name within its organization, e.g. "dev".
	Name string
	// DeploymentID is the tenant this environment's configuration is held in.
	DeploymentID string
	// Rank orders it in the promotion chain. Zero means the end of the chain.
	Rank      int
	DataPlane DataPlane
	// ControlPlaneInsecureSkipVerify skips TLS verification when reading from the control plane.
	ControlPlaneInsecureSkipVerify bool
}

// TenantServiceInterface defines platform tenant-management operations, usable only by the system
// tenant.
type TenantServiceInterface interface {
	CreateTenant(ctx context.Context, request CreateTenantRequest) (*CreateTenantResponse, *tidcommon.ServiceError)
	ListTenants(ctx context.Context) (*TenantListResponse, *tidcommon.ServiceError)
	DeleteTenant(ctx context.Context, deploymentID string) *tidcommon.ServiceError
	// SetBaselineSeeder installs what a later environment of an organization is copied from.
	SetBaselineSeeder(seeder BaselineSeeder)
}

// tenantService is the default implementation of TenantServiceInterface.
type tenantService struct {
	store              tenantStoreInterface
	importSvc          importer.ImportServiceInterface
	defaultsDir        string
	publicURL          string
	systemDeploymentID string
	// bootstrapRun provisions a tenant's baseline. It defaults to bootstrap.Run and is a field so
	// tests can substitute it.
	bootstrapRun func(ctx context.Context, importSvc importer.ImportServiceInterface, opts bootstrap.Options) error
	// seeder copies an organization's configuration into its later environments.
	seeder BaselineSeeder
	// provisionMu serializes provisioning because it sets process-global env vars for the bootstrap
	// bundle's template substitution and runs the bootstrap import.
	provisionMu sync.Mutex
}

// SetBaselineSeeder installs what a later environment of an organization is copied from. It is set
// after the fact because the environment manager is built after this service.
func (s *tenantService) SetBaselineSeeder(seeder BaselineSeeder) {
	s.seeder = seeder
}

func newTenantService(store tenantStoreInterface, importSvc importer.ImportServiceInterface,
	defaultsDir, publicURL, systemDeploymentID string) TenantServiceInterface {
	return &tenantService{
		store:              store,
		importSvc:          importSvc,
		defaultsDir:        defaultsDir,
		publicURL:          publicURL,
		systemDeploymentID: systemDeploymentID,
		bootstrapRun:       bootstrap.Run,
	}
}

// requireSystemTenant ensures the caller belongs to the system tenant (its token carries the system
// deployment id). This is what makes tenant management exclusive to the system tenant.
func (s *tenantService) requireSystemTenant(ctx context.Context) *tidcommon.ServiceError {
	id, ok := deployment.IDFromContext(ctx)
	if !ok || id != s.systemDeploymentID {
		return &ErrorNotSystemTenant
	}
	return nil
}

// CreateTenant provisions an organization's environment and records it in the registry.
//
// The organization's first environment is provisioned from the bootstrap baseline. Every later one is
// created empty and seeded from the first, so an organization's environments hold the same resources
// under the same ids and configuration can be promoted between them. Provisioning each from the
// baseline instead would give every environment its own organization unit, user types and themes, and
// a promotion would then collide with them or name ids the destination has never had.
func (s *tenantService) CreateTenant(ctx context.Context,
	request CreateTenantRequest) (*CreateTenantResponse, *tidcommon.ServiceError) {
	if svcErr := s.requireSystemTenant(ctx); svcErr != nil {
		return nil, svcErr
	}
	if !orgEnvPattern.MatchString(request.Org) || !orgEnvPattern.MatchString(request.Env) {
		return nil, &ErrorInvalidDeploymentID
	}
	deploymentID := deploymentIDFor(request.Org, request.Env)
	if deploymentID == s.systemDeploymentID {
		return nil, &ErrorReservedSystemTenant
	}
	if !deploymentIDPattern.MatchString(deploymentID) {
		return nil, &ErrorInvalidDeploymentID
	}

	provisioned, err := s.store.IsProvisioned(ctx, deploymentID)
	if err != nil {
		return nil, s.internalError(ctx, "failed to check tenant provisioning state", err)
	}
	if provisioned {
		return nil, &ErrorTenantConflict
	}

	seedFrom, svcErr := s.seedSourceFor(ctx, request.Org)
	if svcErr != nil {
		return nil, svcErr
	}

	id, err := utils.GenerateUUIDv7()
	if err != nil {
		return nil, s.internalError(ctx, "failed to generate tenant id", err)
	}

	// The first environment is the only one built from the baseline bundle. A later one is left empty
	// here and filled by the seed below, which is what keeps its ids identical to its organization's.
	var seeded *SeedSummary
	if seedFrom == "" {
		if svcErr := s.provision(ctx, deploymentID, request); svcErr != nil {
			return nil, svcErr
		}
	} else {
		seeded, svcErr = s.seed(ctx, seedFrom, deploymentID)
		if svcErr != nil {
			return nil, svcErr
		}
	}

	// The first environment of an organization is always rank 1: it is the bottom of the promotion
	// chain, the one every other is copied from, and there is nothing to promote into it.
	rank := 0
	if seedFrom == "" {
		rank = 1
	} else if request.Rank != nil {
		rank = *request.Rank
	}
	environment, svcErr := s.registerEnvironment(ctx, request, deploymentID, rank)
	if svcErr != nil {
		return nil, svcErr
	}

	tenant := Tenant{ID: id, DeploymentID: deploymentID, Name: request.Name}
	if err := s.store.CreateTenant(ctx, tenant); err != nil {
		return nil, s.internalError(ctx, "failed to record tenant", err)
	}
	return &CreateTenantResponse{Tenant: tenant, Seeded: seeded, Environment: environment}, nil
}

// registerEnvironment records the new tenant as an environment of its organization. Without a data
// plane to apply to there is no environment to register, which is not an error: the tenant is usable
// and the environment can be registered once its data plane exists.
func (s *tenantService) registerEnvironment(ctx context.Context, request CreateTenantRequest,
	deploymentID string, rank int) (*EnvironmentSummary, *tidcommon.ServiceError) {
	if request.DataPlane == nil || strings.TrimSpace(request.DataPlane.ID) == "" {
		return nil, nil
	}
	if s.seeder == nil {
		return nil, nil
	}

	insecure := request.ControlPlane != nil && request.ControlPlane.InsecureSkipVerify
	summary, err := s.seeder.RegisterEnvironment(ctx, RegisterEnvironmentInput{
		Name:                           request.Env,
		DeploymentID:                   deploymentID,
		Rank:                           rank,
		DataPlane:                      *request.DataPlane,
		ControlPlaneInsecureSkipVerify: insecure,
	})
	if err != nil {
		log.GetLogger().With(log.String(log.LoggerKeyComponentName, tenantLoggerComponentName)).
			Error(ctx, "Failed to register the tenant as an environment",
				log.String("deploymentId", deploymentID), log.Error(err))
		svcErr := ErrorEnvironmentRegistrationFailed
		svcErr.ErrorDescription = tidcommon.I18nMessage{
			Key:          "error.tenantservice.environment_registration_failed_description",
			DefaultValue: err.Error(),
		}
		return nil, &svcErr
	}
	return summary, nil
}

// seedSourceFor returns the deployment id a new environment of this organization is copied from, or
// "" when the organization has none yet and the environment is its first.
//
// The organization's oldest environment is the source. That is the one provisioned from the baseline,
// so it is the only one whose resources are not themselves a copy.
func (s *tenantService) seedSourceFor(ctx context.Context, org string) (string, *tidcommon.ServiceError) {
	tenants, err := s.store.ListTenants(ctx)
	if err != nil {
		return "", s.internalError(ctx, "failed to list tenants", err)
	}

	source := ""
	oldest := ""
	for _, tenant := range tenants {
		if orgOf(tenant.DeploymentID) != org {
			continue
		}
		if oldest == "" || tenant.CreatedAt < oldest {
			oldest = tenant.CreatedAt
			source = tenant.DeploymentID
		}
	}
	return source, nil
}

// seed copies the organization's existing configuration into the new tenant.
func (s *tenantService) seed(ctx context.Context, sourceDeploymentID,
	targetDeploymentID string) (*SeedSummary, *tidcommon.ServiceError) {
	if s.seeder == nil {
		return nil, s.internalError(ctx, "no baseline seeder is configured",
			fmt.Errorf("cannot seed %s from %s", targetDeploymentID, sourceDeploymentID))
	}
	summary, err := s.seeder.SeedTenant(ctx, sourceDeploymentID, targetDeploymentID)
	if err != nil {
		log.GetLogger().With(log.String(log.LoggerKeyComponentName, tenantLoggerComponentName)).
			Error(ctx, "Failed to seed a tenant from its organization",
				log.String("from", sourceDeploymentID), log.String("to", targetDeploymentID),
				log.Error(err))
		svcErr := ErrorSeedFailed
		svcErr.ErrorDescription = tidcommon.I18nMessage{
			Key:          "error.tenantservice.seed_failed_description",
			DefaultValue: err.Error(),
		}
		return nil, &svcErr
	}
	return summary, nil
}

// provision runs the bootstrap import scoped to the target deployment id. It is serialized because it
// sets process-global env vars that the bootstrap bundle's placeholders resolve from.
func (s *tenantService) provision(ctx context.Context, deploymentID string,
	request CreateTenantRequest) *tidcommon.ServiceError {
	s.provisionMu.Lock()
	defer s.provisionMu.Unlock()

	adminUsername := request.AdminUsername
	if adminUsername == "" {
		adminUsername = "admin"
	}
	adminPassword := request.AdminPassword
	if adminPassword == "" {
		adminPassword = "admin"
	}

	for key, value := range map[string]string{
		"ADMIN_USERNAME":          adminUsername,
		"ADMIN_PASSWORD":          adminPassword,
		"PUBLIC_URL":              s.publicURL,
		"CONSOLE_REDIRECT_URIS_0": s.publicURL + "/console",
	} {
		if err := os.Setenv(key, value); err != nil {
			return s.internalError(ctx, "failed to set bootstrap environment", err)
		}
	}

	if err := s.bootstrapRun(ctx, s.importSvc, bootstrap.Options{
		DefaultsDir:  s.defaultsDir,
		DeploymentID: deploymentID,
	}); err != nil {
		return s.internalError(ctx, "failed to provision tenant baseline", err)
	}
	return nil
}

// ListTenants returns all managed tenants.
func (s *tenantService) ListTenants(ctx context.Context) (*TenantListResponse, *tidcommon.ServiceError) {
	if svcErr := s.requireSystemTenant(ctx); svcErr != nil {
		return nil, svcErr
	}
	tenants, err := s.store.ListTenants(ctx)
	if err != nil {
		return nil, s.internalError(ctx, "failed to list tenants", err)
	}
	return &TenantListResponse{TotalResults: len(tenants), Count: len(tenants), Tenants: tenants}, nil
}

// DeleteTenant deprovisions a tenant: purges all of its data and removes its registry row. The system
// tenant itself cannot be deleted.
func (s *tenantService) DeleteTenant(ctx context.Context, deploymentID string) *tidcommon.ServiceError {
	if svcErr := s.requireSystemTenant(ctx); svcErr != nil {
		return svcErr
	}
	if deploymentID == s.systemDeploymentID {
		return &ErrorReservedSystemTenant
	}

	provisioned, err := s.store.IsProvisioned(ctx, deploymentID)
	if err != nil {
		return s.internalError(ctx, "failed to check tenant provisioning state", err)
	}
	if !provisioned {
		if _, getErr := s.store.GetTenant(ctx, deploymentID); errors.Is(getErr, errTenantNotFound) {
			return &ErrorTenantNotFound
		}
	}

	if err := s.store.PurgeTenantData(ctx, deploymentID); err != nil {
		return s.internalError(ctx, "failed to purge tenant data", err)
	}
	if err := s.store.DeleteTenantRecord(ctx, deploymentID); err != nil {
		return s.internalError(ctx, "failed to delete tenant record", err)
	}
	return nil
}

// internalError logs the underlying error and returns the generic server-side ServiceError.
func (s *tenantService) internalError(ctx context.Context, msg string, err error) *tidcommon.ServiceError {
	logger := log.GetLogger().With(log.String(log.LoggerKeyComponentName, tenantLoggerComponentName))
	logger.Error(ctx, msg, log.Error(err))
	return &ErrorInternalServer
}
