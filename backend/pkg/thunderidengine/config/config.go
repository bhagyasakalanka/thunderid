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

// Package config holds Thunder ID engine configuration types shared across packages.
package config

import (
	"time"
)

// TrustedIssuerConfig holds configuration for trusted external issuer authentication.
// Setting Issuer activates the feature: the server trusts tokens carrying that iss claim
// and validates them via the external authentication server's JWKS endpoint. When Issuer
// is set, JWKSURL and Audience are required and the server fails to start if either is
// missing.
//
// Per RFC 9068 §2.2 and RFC 8707, the Audience field must be set to this server's own
// identifier (typically its public URL). The frontend must include a matching "resource"
// parameter in the authorization request so the auth server sets the token's "aud" claim
// to this server's identifier.
//
// RequiredClaims enforces that incoming tokens contain specific claims with expected values.
// Each entry specifies a claim name and the value it must hold. If any required claim is
// missing or does not match, the token is rejected.
type TrustedIssuerConfig struct {
	Issuer         string          `yaml:"issuer"          json:"issuer"`
	JWKSURL        string          `yaml:"jwks_url"        json:"jwks_url"`
	Audience       string          `yaml:"audience"        json:"audience"`
	RequiredClaims []RequiredClaim `yaml:"required_claims" json:"required_claims"`
}

// SecurityConfig holds the security-related configuration details.
//
// JWKSCacheTTL controls how long fetched JWKS responses are reused from the in-process
// cache before being re-fetched. It is not specific to trusted_issuer: the same cache
// backs every JWKS consumer in the server (trusted issuer validation, federated OIDC
// authenticators such as Google, etc.), so the setting lives at the security level
// rather than nested under any particular consumer. Value is in seconds; zero disables
// the cache; negative values are rejected at load time.
type SecurityConfig struct {
	JWKSCacheTTL           int                   `yaml:"jwks_cache_ttl"           json:"jwks_cache_ttl"`
	TrustedIssuer          TrustedIssuerConfig   `yaml:"trusted_issuer"           json:"trusted_issuer"`
	SystemPermissionPrefix string                `yaml:"system_permission_prefix" json:"system_permission_prefix"`
	TokenRevocation        TokenRevocationConfig `yaml:"token_revocation"         json:"token_revocation"`
	SecretProvider         SecretProviderConfig  `yaml:"secret_provider"          json:"secret_provider"`
	// DirectAuthSecret gates the Direct API endpoints (/auth/**, /register/passkey/**, /access/**).
	// When set, callers must present this value in the Direct-Auth-Secret header; when empty, those
	// endpoints are blocked (secure by default).
	DirectAuthSecret string `yaml:"direct_auth_secret" json:"direct_auth_secret"`
	// EnvironmentManager configures the in-process environment manager. Disabled when unset.
	EnvironmentManager EnvironmentManagerConfig `yaml:"environment_manager" json:"environment_manager"`
}

// SecretProviderConfig configures where this deployment's secrets live. Configuration promoted from a
// Control Plane stores a reference such as "kv:MY_APP_CLIENT_SECRET" rather than the secret itself, and
// this is what turns such a reference back into its value.
//
// Mode selects the source. It also decides where a secret pushed down from a Control Plane is written,
// because a deployment reads its secrets back from wherever it stores them; a mode that could store to
// one place and read from another would let the two drift apart.
//
// Leaving Mode empty disables secret handling entirely: no store is served, and a value held as a
// reference cannot be resolved.
type SecretProviderConfig struct {
	// Mode is one of SecretModeFile, SecretModeKV, or SecretModeService.
	Mode string `yaml:"mode" json:"mode"`
	// File configures SecretModeFile.
	File FileSecretConfig `yaml:"file" json:"file"`
	// KV configures SecretModeKV.
	KV KVSecretConfig `yaml:"kv" json:"kv"`
	// Service configures SecretModeService.
	Service SecretServiceConfig `yaml:"service" json:"service"`
}

// Secret provider modes.
const (
	// SecretModeFile keeps secrets in a JSON file beside the server. It needs nothing else deployed,
	// which suits a single instance and local development. Each instance has its own file, so a
	// deployment running several of them does not share what it stores.
	SecretModeFile = "file"
	// SecretModeKV keeps secrets in an external key vault, which is what several instances of one
	// deployment share.
	SecretModeKV = "kv"
	// SecretModeService reads from the standalone secret provider service over HTTP. It is read only:
	// the service owns its own writes, so a Control Plane cannot push a secret into it from here.
	SecretModeService = "service"
)

// FileSecretConfig configures the file-backed secret store.
type FileSecretConfig struct {
	// Path is the JSON file the secrets are kept in. It is created on the first write.
	Path string `yaml:"path" json:"path"`
}

// KVSecretConfig configures the key-vault-backed secret store.
//
// Type names the vault implementation. Only "openbao" is implemented; the others are recognized names
// that fail at startup with a clear message rather than being silently ignored, so a deployment
// pointed at an unimplemented vault does not come up believing it has secrets.
type KVSecretConfig struct {
	Type string `yaml:"type" json:"type"`
	// Address is the vault's base URL, for example https://openbao.example:8200.
	Address string `yaml:"address" json:"address"`
	// Mount is the KV engine's mount path. Defaults to "secret".
	Mount string `yaml:"mount" json:"mount"`
	// PathPrefix scopes this deployment's secrets within the mount, so several deployments can share
	// one vault without colliding. For example "thunderid/org1-dev".
	PathPrefix string `yaml:"path_prefix" json:"path_prefix"`
	// Namespace selects a vault namespace, for the implementations that have them. Empty means none.
	Namespace string `yaml:"namespace" json:"namespace"`
	// Token authenticates to the vault. Mount it as a file and reference it as file://path rather than
	// writing it here.
	Token string `yaml:"token" json:"token"`
	// CAFile is the certificate authority that signed the vault's certificate, when it is not one the
	// system already trusts.
	CAFile string `yaml:"ca_file" json:"ca_file"`
	// TimeoutSeconds bounds a single call to the vault. A non-positive value falls back to the default.
	TimeoutSeconds int `yaml:"timeout_seconds" json:"timeout_seconds"`
	// CacheTTLSeconds is how long secrets read from the vault are reused before being read again. It
	// bounds how long one instance can keep serving a secret another instance has since changed. A
	// non-positive value falls back to the default; the cache cannot be disabled, because every
	// resolution would otherwise become an outbound call.
	CacheTTLSeconds int `yaml:"cache_ttl_seconds" json:"cache_ttl_seconds"`
}

// SecretServiceConfig configures reading from the standalone secret provider service.
type SecretServiceConfig struct {
	URL   string `yaml:"url"   json:"url"`
	Token string `yaml:"token" json:"token"`
	// TimeoutSeconds bounds a call to the service. A non-positive value falls back to the default.
	TimeoutSeconds int `yaml:"timeout_seconds" json:"timeout_seconds"`
}

// EnvironmentManagerConfig configures the in-process environment manager, which promotes
// configuration between deployments. It is a control plane concern and is ignored elsewhere.
//
// DataDir is where environments and captured versions are kept. Leaving it empty disables the
// module, which is what a deployment using the standalone environment manager service wants.
type EnvironmentManagerConfig struct {
	DataDir string `yaml:"data_dir" json:"data_dir"`
}

// TokenRevocationConfig configures the Resource Server's token-revocation enforcement: an in-memory
// cache of revoked tokens synced from a source on a fixed interval. When disabled, protected
// endpoints do not check revocation.
//
// Source selects where the deny list is synced from. Only "db" (the runtime persistent database) is supported
// today; future values may include an endpoint or event stream. SyncIntervalSeconds bounds how stale
// the cache may be; a non-positive value falls back to the built-in default.
type TokenRevocationConfig struct {
	Enabled             bool   `yaml:"enabled"               json:"enabled"`
	Source              string `yaml:"source"                json:"source"`
	SyncIntervalSeconds int    `yaml:"sync_interval_seconds" json:"sync_interval_seconds"`
}

// tokenRevocationSourceDB is the operation-database sync source, the only supported
// token_revocation.source value today.
const tokenRevocationSourceDB = "db"

// KeyConfig holds the key configuration details.
type KeyConfig struct {
	ID       string `yaml:"id"        json:"id"`
	CertFile string `yaml:"cert_file" json:"cert_file"`
	KeyFile  string `yaml:"key_file"  json:"key_file"`
}

// CacheProperty defines the properties for individual caches.
type CacheProperty struct {
	Name           string `yaml:"name"            json:"name"`
	Disabled       bool   `yaml:"disabled"        json:"disabled"`
	Size           int    `yaml:"size"            json:"size"`
	TTL            int    `yaml:"ttl"             json:"ttl"`
	EvictionPolicy string `yaml:"eviction_policy" json:"eviction_policy"`
}

// CacheConfig holds the cache configuration details.
type CacheConfig struct {
	Disabled        bool            `yaml:"disabled"             json:"disabled"`
	Type            string          `yaml:"type"                 json:"type"`
	Size            int             `yaml:"size"                 json:"size"`
	TTL             int             `yaml:"ttl"                  json:"ttl"`
	EvictionPolicy  string          `yaml:"eviction_policy"      json:"eviction_policy"`
	CleanupInterval int             `yaml:"cleanup_interval"     json:"cleanup_interval"`
	Properties      []CacheProperty `yaml:"properties,omitempty" json:"properties,omitempty"`
	Redis           RedisConfig     `yaml:"redis"                json:"redis"`
}

// RedisConfig holds the Redis connection configuration.
type RedisConfig struct {
	Address           string `yaml:"address"              json:"address"`
	Username          string `yaml:"username"             json:"username"`
	Password          string `yaml:"password"             json:"password"`
	DB                int    `yaml:"db"                   json:"db"`
	KeyPrefix         string `yaml:"key_prefix"           json:"key_prefix"`
	MaxRetries        int    `yaml:"max_retries"          json:"max_retries"`
	MinRetryBackoffMS int    `yaml:"min_retry_backoff_ms" json:"min_retry_backoff_ms"`
	MaxRetryBackoffMS int    `yaml:"max_retry_backoff_ms" json:"max_retry_backoff_ms"`
	DialTimeoutMS     int    `yaml:"dial_timeout_ms"      json:"dial_timeout_ms"`
	ReadTimeoutMS     int    `yaml:"read_timeout_ms"      json:"read_timeout_ms"`
	WriteTimeoutMS    int    `yaml:"write_timeout_ms"     json:"write_timeout_ms"`
}

// ServerConfig holds the server configuration details.
type ServerConfig struct {
	Hostname string `yaml:"hostname"   json:"hostname"`
	Port     int    `yaml:"port"       json:"port"`
	HTTPOnly bool   `yaml:"http_only"  json:"http_only"`
	// Mode selects which planes this instance serves: "hybrid" (default, both the control-plane
	// configuration APIs and the data-plane runtime + identity APIs), "cp" (control plane only:
	// configuration management such as applications, IdPs, flows, roles, groups, OUs), or "dp"
	// (data plane only: runtime plus data-plane management such as users, agents, role assignment).
	// It gates only the management HTTP surface; public runtime endpoints are always served.
	Mode      string `yaml:"mode"       json:"mode"`
	PublicURL string `yaml:"public_url" json:"public_url"`
	// ControlPlaneManaged marks this deployment as receiving its configuration from a control plane.
	// The import records every resource it writes, and this deployment's own management APIs then
	// refuse to change those: an edit made here would survive only until the next promotion overwrote
	// it. Resources created on this deployment are unaffected and stay editable. Off by default, which
	// is what a standalone server with no control plane in front of it wants.
	ControlPlaneManaged bool `yaml:"control_plane_managed" json:"control_plane_managed"`
	// Identifier is the deployment id that scopes all persisted resources when DeploymentIDSource is
	// "server". For a single-tenant instance it is the only value stores partition by.
	Identifier string `yaml:"identifier" json:"identifier"`
	// DeploymentIDSource selects where the per-request deployment id (the value stores partition by)
	// comes from. It is an exclusive switch:
	//   "server" (default) - always use Identifier; any deployment claim in the token is ignored.
	//   "token"            - always use the DeploymentIDClaim from the authenticated caller's token;
	//                        Identifier is never consulted for requests, and an authenticated request
	//                        whose token lacks the claim is rejected. This is what makes a single
	//                        instance multi-tenant over one database.
	DeploymentIDSource string `yaml:"deployment_id_source" json:"deployment_id_source"`
	// DeploymentIDClaim is the name of the token claim carrying the per-request deployment id. It is
	// required when DeploymentIDSource is "token" and unused otherwise.
	DeploymentIDClaim string `yaml:"deployment_id_claim" json:"deployment_id_claim"`
	// SystemDeploymentID is the reserved deployment id of the platform "system" tenant - the single
	// tenant allowed to manage other tenants via the /system APIs. Defaults to "root" when empty.
	SystemDeploymentID string         `yaml:"system_deployment_id" json:"system_deployment_id"`
	SecurityConfig     SecurityConfig `yaml:"security"            json:"security"`
}

// Deployment id source modes for ServerConfig.DeploymentIDSource.
const (
	// DeploymentIDSourceServer scopes persistence by the configured Identifier and ignores any
	// deployment claim in the token. It is the default when DeploymentIDSource is empty.
	DeploymentIDSourceServer = "server"
	// DeploymentIDSourceToken scopes persistence by the token's deployment claim and never falls
	// back to the configured Identifier for requests.
	DeploymentIDSourceToken = "token"
)

// GateClientConfig holds the client configuration details.
type GateClientConfig struct {
	Hostname     string `yaml:"hostname"      json:"hostname"`
	Port         int    `yaml:"port"          json:"port"`
	Scheme       string `yaml:"scheme"        json:"scheme"`
	Path         string `yaml:"path"          json:"path"`
	LoginPath    string `yaml:"login_path"    json:"login_path"`
	SignOutPath  string `yaml:"signout_path"   json:"signout_path"`
	ErrorPath    string `yaml:"error_path"    json:"error_path"`
	CallbackPath string `yaml:"callback_path" json:"callback_path"`
}

// EncryptionConfig holds the encryption configuration details.
type EncryptionConfig struct {
	Key string `yaml:"key" json:"key"`
}

// JWTConfig holds the JWT configuration details.
type JWTConfig struct {
	Issuer         string `yaml:"issuer"           json:"issuer"`
	ValidityPeriod int64  `yaml:"validity_period"  json:"validity_period"`
	Audience       string `yaml:"audience"         json:"audience"`
	PreferredKeyID string `yaml:"preferred_key_id" json:"preferred_key_id"`
	Leeway         int64  `yaml:"leeway"           json:"leeway"`
}

// AuthClassConfig holds the ACR-AMR mapping configuration.
type AuthClassConfig struct {
	Amrs   []string            `yaml:"amrs"    json:"amrs"`
	AcrAMR map[string][]string `yaml:"acr_amr" json:"acr_amr"`
}

// RefreshTokenConfig holds the refresh token configuration details.
type RefreshTokenConfig struct {
	RenewOnGrant          bool  `yaml:"renew_on_grant"           json:"renew_on_grant"`
	RevokePreviousOnRenew bool  `yaml:"revoke_previous_on_renew" json:"revoke_previous_on_renew"`
	ValidityPeriod        int64 `yaml:"validity_period"          json:"validity_period"`
}

// AuthorizationCodeConfig holds the authorization code configuration details.
type AuthorizationCodeConfig struct {
	ValidityPeriod int64 `yaml:"validity_period" json:"validity_period"`
}

// DCRConfig holds the Dynamic Client Registration configuration.
type DCRConfig struct {
	Insecure bool `yaml:"insecure" json:"insecure"`
}

// PARConfig holds the Pushed Authorization Request (RFC 9126) configuration.
type PARConfig struct {
	RequirePAR bool  `yaml:"require_par" json:"require_par"`
	ExpiresIn  int64 `yaml:"expires_in"  json:"expires_in"`
}

// DPoPConfig holds the OAuth 2.0 DPoP configuration.
type DPoPConfig struct {
	Required     bool     `yaml:"required"       json:"required"`
	IatWindow    int      `yaml:"iat_window"     json:"iat_window"`
	Leeway       int      `yaml:"leeway"         json:"leeway"`
	AllowedAlgs  []string `yaml:"allowed_algs"   json:"allowed_algs"`
	MaxJTILength int      `yaml:"max_jti_length" json:"max_jti_length"`
}

// CIBAConfig holds the CIBA configuration.
type CIBAConfig struct {
	IDTokenHintMaxAgeDays int `yaml:"id_token_hint_max_age_days" json:"id_token_hint_max_age_days"`
}

// OAuthConfig holds the OAuth configuration details.
type OAuthConfig struct {
	RefreshToken      RefreshTokenConfig      `yaml:"refresh_token"               json:"refresh_token"`
	AuthorizationCode AuthorizationCodeConfig `yaml:"authorization_code"          json:"authorization_code"`
	DCR               DCRConfig               `yaml:"dcr"                         json:"dcr"`
	PAR               PARConfig               `yaml:"par"                         json:"par"`
	DPoP              DPoPConfig              `yaml:"dpop"                        json:"dpop"`
	AuthClass         AuthClassConfig         `yaml:"auth_class"                  json:"auth_class"`
	CIBA              CIBAConfig              `yaml:"ciba"                        json:"ciba"`
	// AllowWildcardRedirectURI enables wildcard pattern matching for redirect URIs.
	// When false (default), only exact redirect URI matching is performed.
	AllowWildcardRedirectURI bool `yaml:"allow_wildcard_redirect_uri" json:"allow_wildcard_redirect_uri"`
}

// FlowConfig holds the configuration details for the flow service.
type FlowConfig struct {
	DefaultAuthFlowHandle    string `yaml:"default_auth_flow_handle"    json:"default_auth_flow_handle"`
	UserOnboardingFlowHandle string `yaml:"user_onboarding_flow_handle" json:"user_onboarding_flow_handle"`
	MaxVersionHistory        int    `yaml:"max_version_history"         json:"max_version_history"`
	AutoInferRegistration    bool   `yaml:"auto_infer_registration"     json:"auto_infer_registration"`
	Store                    string `yaml:"store"                       json:"store"`
	// Executors lists built-in executor names to register (e.g. CredentialsAuthExecutor).
	// When empty, all built-in executors are registered. When set, only listed executors
	// are available; omit only executors you intentionally disable on this node.
	Executors []string `yaml:"executors"                   json:"executors"`
	// Interceptors lists built-in interceptor names to register (e.g. CaptchaInterceptor).
	// When empty, all built-in interceptors are registered. When set, only listed interceptors
	// are available; omit only interceptors you intentionally disable on this node.
	Interceptors []string `yaml:"interceptors"                json:"interceptors"`
}

// RequiredClaim defines a claim name and expected value that must be present in the token.
type RequiredClaim struct {
	Claim string `yaml:"claim" json:"claim"`
	Value string `yaml:"value" json:"value"`
}

// ResourceConfig holds the resource management configuration details.
type ResourceConfig struct {
	DefaultDelimiter string `yaml:"default_delimiter" json:"default_delimiter"`
	// Store defines the storage mode for resource servers.
	// Valid values: "mutable", "declarative", "composite" (hybrid mode)
	// If not specified, falls back to global DeclarativeResources.Enabled setting:
	//   - If DeclarativeResources.Enabled = true: behaves as "declarative"
	//   - If DeclarativeResources.Enabled = false: behaves as "mutable"
	Store string `yaml:"store"             json:"store"`
}

// ObservabilityConfig holds the observability configuration details.
type ObservabilityConfig struct {
	Enabled     bool                      `yaml:"enabled"      json:"enabled"`
	Output      ObservabilityOutputConfig `yaml:"output"       json:"output"`
	FailureMode string                    `yaml:"failure_mode" json:"failure_mode"`
}

// ObservabilityOutputConfig holds observability output configuration.
type ObservabilityOutputConfig struct {
	File          ObservabilityFileConfig    `yaml:"file"          json:"file"`
	Console       ObservabilityConsoleConfig `yaml:"console"       json:"console"`
	OpenTelemetry ObservabilityOTelConfig    `yaml:"opentelemetry" json:"opentelemetry"`
}

// ObservabilityFileConfig captures file sink settings for observability events.
type ObservabilityFileConfig struct {
	Enabled       bool          `yaml:"enabled"        json:"enabled"`
	FilePath      string        `yaml:"file_path"      json:"file_path"`
	Format        string        `yaml:"format"         json:"format"`
	BufferSize    int           `yaml:"buffer_size"    json:"buffer_size"`
	FlushInterval time.Duration `yaml:"flush_interval" json:"flush_interval"`
	Categories    []string      `yaml:"categories"     json:"categories"`
}

// ObservabilityConsoleConfig captures console sink settings for observability events.
type ObservabilityConsoleConfig struct {
	Enabled    bool     `yaml:"enabled"    json:"enabled"`
	Format     string   `yaml:"format"     json:"format"`
	Categories []string `yaml:"categories" json:"categories"`
}

// ObservabilityOTelConfig holds OpenTelemetry configuration.
type ObservabilityOTelConfig struct {
	Enabled        bool     `yaml:"enabled"         json:"enabled"`
	ExporterType   string   `yaml:"exporter_type"   json:"exporter_type"`
	OTLPEndpoint   string   `yaml:"otlp_endpoint"   json:"otlp_endpoint"`
	ServiceName    string   `yaml:"service_name"    json:"service_name"`
	ServiceVersion string   `yaml:"service_version" json:"service_version"`
	Environment    string   `yaml:"environment"     json:"environment"`
	SampleRate     float64  `yaml:"sample_rate"     json:"sample_rate"`
	Categories     []string `yaml:"categories"      json:"categories"`
	// Insecure disables TLS for OTLP (not recommended for production)
	Insecure bool `yaml:"insecure"        json:"insecure"`
}
