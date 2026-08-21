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
// against this deployment and the configuration carries only a placeholder. The placeholder is filled
// with the credential itself, so the resource is written through the ordinary API with a real value and
// is indistinguishable from one created here by hand. A credential that is only ever verified is
// hashed by that API, the same as any other.
//
// A credential the store holds only as a hash cannot be filled in, because a hash cannot be turned
// back into the value the resource needs. Those keep the reference, which is resolved at
// authentication instead.
//
// Values the caller did send always win, so an explicit request is never overridden.
func fillSecretPlaceholders(ctx context.Context, content string,
	variables map[string]interface{}) map[string]interface{} {
	filled := make(map[string]interface{}, len(variables))
	for k, v := range variables {
		filled[k] = v
	}

	resolver := secretresolver.Default()

	for _, name := range referencedVariables(scalarTemplateVarPattern, content) {
		if _, ok := filled[name]; ok {
			continue
		}
		// A hash cannot be turned back into the value a resource needs, and writing the hash itself
		// into the configuration would store a credential nothing can verify against. Those keep the
		// reference, which is resolved at authentication instead.
		if _, found, err := resolver.ResolveHash(ctx, secretresolver.Prefix+name); err == nil && found {
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
