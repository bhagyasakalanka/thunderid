// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package promote

import (
	"context"
	"strings"

	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"

	"github.com/thunder-id/thunderid/internal/system/deployment"
	"github.com/thunder-id/thunderid/internal/system/export"
	"github.com/thunder-id/thunderid/internal/system/importer"
	"github.com/thunder-id/thunderid/internal/system/log"
)

// statusFailed is the per-resource status an import reports for a document it refused. It is the
// value carried in the import API's JSON, so it is a contract rather than an internal detail.
const statusFailed = "failed"

// wildcard asks an exporter for every resource of its type.
const wildcard = "*"

// ServiceInterface is the promotion surface.
type ServiceInterface interface {
	// Promote copies the configuration of one deployment into another.
	Promote(ctx context.Context, request *Request) (*Response, *tidcommon.ServiceError)
}

type service struct {
	exporter export.ExportServiceInterface
	importer importer.ImportServiceInterface
}

func newService(exporter export.ExportServiceInterface,
	importer importer.ImportServiceInterface) ServiceInterface {
	return &service{exporter: exporter, importer: importer}
}

// Promote reads every configuration resource of the source deployment and writes it to the target.
//
// The two halves run under different deployment ids on the same context. Every store resolves its
// scope from the context, so reading one environment and writing another needs no special path
// through the stores and no second connection: it is the ordinary export and the ordinary import,
// each told which scope it is acting for.
//
// The source's variable values are deliberately not carried across. An export renders
// deployment-owned fields as placeholders, and the import fills them from the target's own variable
// store, so a redirect URI or a client secret belonging to staging stays staging's. A placeholder
// the target cannot fill fails that resource rather than silently inheriting the source's value,
// which is the outcome to want: it names what the target is missing.
func (s *service) Promote(ctx context.Context, request *Request) (*Response, *tidcommon.ServiceError) {
	logger := log.GetLogger().With(log.String(log.LoggerKeyComponentName, "PromoteService"))

	from, to, svcErr := validate(request)
	if svcErr != nil {
		return nil, svcErr
	}

	exportRequest, svcErr := exportFor(request.Resources)
	if svcErr != nil {
		return nil, svcErr
	}

	exported, svcErr := s.exporter.ExportResources(deployment.WithID(ctx, from), exportRequest)
	if svcErr != nil {
		// An empty source is a state the caller can act on, so it is reported as its own condition
		// rather than as whatever the export called it.
		if svcErr.Code == export.ErrorNoResourcesFound.Code {
			return nil, &ErrorSourceEmpty
		}
		return nil, svcErr
	}

	imported, svcErr := s.importer.ImportResources(deployment.WithID(ctx, to), &importer.ImportRequest{
		Content: combine(exported.Files),
		DryRun:  request.DryRun,
	})
	if svcErr != nil {
		return nil, svcErr
	}

	response := &Response{From: from, To: to, DryRun: request.DryRun}
	if imported.Summary != nil {
		response.Resources = imported.Summary.Imported
	}
	for _, outcome := range imported.Results {
		if outcome.Status != statusFailed {
			continue
		}
		response.Failures = append(response.Failures, Failure{
			ResourceType: outcome.ResourceType,
			Name:         outcome.ResourceName,
			Reason:       outcome.Message,
		})
	}

	logger.Info(ctx, "Promoted configuration between deployments",
		log.String("from", from), log.String("to", to),
		log.Int("resources", response.Resources), log.Int("failures", len(response.Failures)))

	return response, nil
}

// validate checks the two deployments a promotion names.
func validate(request *Request) (string, string, *tidcommon.ServiceError) {
	if request == nil {
		return "", "", tidcommon.CustomServiceError(ErrorInvalidRequest, tidcommon.I18nMessage{
			Key:          "error.promoteservice.nil_request_description",
			DefaultValue: "A promotion request is required",
		})
	}

	from := strings.TrimSpace(request.From)
	to := strings.TrimSpace(request.To)
	if from == "" || to == "" {
		return "", "", tidcommon.CustomServiceError(ErrorInvalidRequest, tidcommon.I18nMessage{
			Key:          "error.promoteservice.deployments_required_description",
			DefaultValue: "Both a source and a target deployment are required",
		})
	}
	// Promoting a deployment into itself would rewrite it with its own contents. That is not an
	// operation anyone means to perform, so it is refused rather than run as an expensive no-op.
	if from == to {
		return "", "", tidcommon.CustomServiceError(ErrorInvalidRequest, tidcommon.I18nMessage{
			Key:          "error.promoteservice.same_deployment_description",
			DefaultValue: "The source and target deployments must differ",
		})
	}
	return from, to, nil
}

// exportFor builds the export a promotion reads, either everything or just the resources named.
func exportFor(selection []ResourceRef) (*export.ExportRequest, *tidcommon.ServiceError) {
	if len(selection) == 0 {
		return configurationExport(), nil
	}
	return selectedExport(selection)
}

// configurationExport asks for every resource a promotion carries.
//
// Users and groups are absent, and that is the point of listing the types rather than exporting
// whatever exists. They are identity data rather than configuration: promoting them would put the
// accounts someone created while testing into the environment being promoted to. Configuration is
// what differs between environments by design; who exists in them is not.
func configurationExport() *export.ExportRequest {
	all := []string{wildcard}
	request := &export.ExportRequest{}
	for _, field := range promotableTypes(request) {
		*field = all
	}
	return request
}

// selectedExport asks for exactly the resources named, refusing a type a promotion does not carry.
//
// An unknown or unpromotable type is an error rather than an entry quietly dropped: a caller that
// asked for a user to be promoted has misunderstood what a promotion does, and silently promoting
// everything else would hide that.
func selectedExport(selection []ResourceRef) (*export.ExportRequest, *tidcommon.ServiceError) {
	request := &export.ExportRequest{}
	fields := promotableTypes(request)
	for _, ref := range selection {
		resourceType := strings.TrimSpace(ref.Type)
		id := strings.TrimSpace(ref.ID)
		if resourceType == "" || id == "" {
			return nil, tidcommon.CustomServiceError(ErrorInvalidRequest, tidcommon.I18nMessage{
				Key:          "error.promoteservice.incomplete_resource_description",
				DefaultValue: "Every named resource needs both a type and an id",
			})
		}
		field, ok := fields[resourceType]
		if !ok {
			return nil, tidcommon.CustomServiceError(ErrorUnpromotableType, tidcommon.I18nMessage{
				Key:          "error.promoteservice.unpromotable_type_named_description",
				DefaultValue: "Resource type " + resourceType + " is not carried by a promotion",
			})
		}
		*field = append(*field, id)
	}
	return request, nil
}

// promotableTypes maps each resource type a promotion carries to its field on an export request, so
// the set of promotable types is stated once and both the wildcard and the selected form read it.
func promotableTypes(request *export.ExportRequest) map[string]*[]string {
	return map[string]*[]string{
		"application":              &request.Applications,
		"agent":                    &request.Agents,
		"connection":               &request.Connections,
		"user_type":                &request.UserTypes,
		"agent_type":               &request.AgentTypes,
		"organization_unit":        &request.OrganizationUnits,
		"resource_server":          &request.ResourceServers,
		"role":                     &request.Roles,
		"flow":                     &request.Flows,
		"translation":              &request.Translations,
		"layout":                   &request.Layouts,
		"theme":                    &request.Themes,
		"server_config":            &request.ServerConfigs,
		"credential_configuration": &request.CredentialConfigurations,
		"presentation_definition":  &request.PresentationDefinitions,
	}
}

// combine joins exported files into the single document an import reads. The separator is what the
// import parser splits on, and each file is already a complete document.
func combine(files []export.ExportFile) string {
	var builder strings.Builder
	for i := range files {
		if i > 0 {
			builder.WriteString("\n---\n")
		}
		builder.WriteString(files[i].Content)
	}
	return builder.String()
}
