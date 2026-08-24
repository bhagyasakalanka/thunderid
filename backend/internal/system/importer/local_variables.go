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
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package importer

import (
	"context"
	"regexp"

	"github.com/thunder-id/thunderid/internal/system/config"
	"github.com/thunder-id/thunderid/internal/system/secretresolver"
)

var scalarTemplateVarPattern = regexp.MustCompile(`\{\{\s*\.([A-Za-z_][A-Za-z0-9_]*)\s*\}\}`)

// fillSecretPlaceholders supplies values for the credential placeholders the caller did not send,
// reading them from this deployment's own secret store.
//
// Secrets are the only thing this server fills in. Every other value belongs to whoever is applying
// the configuration and arrives in the request, so a placeholder with no value fails the import rather
// than being resolved from something on this host: silently taking a different value from here is how
// two deployments end up disagreeing about what was applied to them.
//
// A credential is different because it deliberately never travels with the configuration: it is set
// against this deployment and the configuration carries only a placeholder.
//
// How that placeholder is filled depends on whether this deployment is applied to by a control plane.
// If it is, the credential the placeholder refers to was pushed into this deployment's store
// beforehand: the placeholder is filled with the credential itself, so the resource is written through
// the ordinary API with a real value and is indistinguishable from one created here by hand. Hashing
// is left to that API, so nothing here needs to know which credentials are only ever verified.
//
// Anywhere else, including a standalone server, the placeholder keeps the reference for a credential
// held as a hash, and only a readable one is substituted. Nothing has put the credential in such a
// server's store for this import to find, and rewriting its resources with values read from a local
// store would change what a plain import means.
//
// Values the caller did send always win, so an explicit request is never overridden.
func fillSecretPlaceholders(ctx context.Context, content string,
	variables map[string]interface{}) map[string]interface{} {
	filled := make(map[string]interface{}, len(variables))
	for k, v := range variables {
		filled[k] = v
	}

	resolver := secretresolver.Default()
	managed := isControlPlaneManaged()

	for _, name := range referencedVariables(scalarTemplateVarPattern, content) {
		if _, ok := filled[name]; ok {
			continue
		}
		if _, found, err := resolver.ResolveHash(ctx, secretresolver.Prefix+name); err == nil && found {
			// Where a control plane applies configuration, the store is expected to hold the credential
			// itself, because that is what the control plane pushed there. A hash means the value this
			// import needs is not present, so the placeholder is left alone and the import says so,
			// rather than writing hash material into the resource and appearing to have worked.
			if managed {
				continue
			}
			// Elsewhere a hash keeps its reference, resolved at authentication instead.
			filled[name] = secretresolver.Prefix + name
			continue
		}
		if value, err := resolver.Resolve(ctx, secretresolver.Prefix+name); err == nil && value != "" {
			filled[name] = value
		}
	}

	return filled
}

// referencedVariables returns the distinct placeholder names a pattern matches in content.
func referencedVariables(pattern *regexp.Regexp, content string) []string {
	seen := map[string]bool{}
	var names []string
	for _, match := range pattern.FindAllStringSubmatch(content, -1) {
		if len(match) > 1 && !seen[match[1]] {
			seen[match[1]] = true
			names = append(names, match[1])
		}
	}
	return names
}

// isControlPlaneManaged reports whether this deployment receives its configuration from a control
// plane, which is what decides whether a credential is expected to be in its store already.
//
// Read at call time rather than captured, because the importer is built before the runtime
// configuration is loaded in some entry points, and a stale answer here would decide how every
// credential is written.
func isControlPlaneManaged() bool {
	if !config.IsServerRuntimeInitialized() {
		return false
	}
	return config.GetServerRuntime().Config.Server.ControlPlaneManaged
}
