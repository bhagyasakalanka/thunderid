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

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"strings"

	"github.com/thunder-id/thunderid/internal/envmgr/thunder"
	"github.com/thunder-id/thunderid/internal/system/config"
	"github.com/thunder-id/thunderid/internal/system/deployment"
	"github.com/thunder-id/thunderid/internal/system/importer"
)

// localControlPlane writes promoted configuration into a named tenant of this server.
//
// A promotion moves configuration from one environment's tenant into another's, and a tenant is
// resolved from the caller's token. The caller has a token for the tenant they started from and can
// have none for the destination, so the write is carried out here against the tenant the environment
// names, rather than over HTTP with whatever token happens to be in hand.
type localControlPlane struct {
	importService importer.ImportServiceInterface
	// baseURL is where this server answers, so an environment naming a genuinely remote control plane is
	// still reached over HTTP instead of being written here by mistake.
	baseURL string
}

// Hosts reports whether a base URL addresses this server.
func (c *localControlPlane) Hosts(baseURL string) bool {
	return sameHost(c.baseURL, baseURL)
}

// sameHost compares two URLs by host and port, treating the loopback names as one host because a
// server is commonly addressed by either.
func sameHost(a, b string) bool {
	hostA, okA := hostPort(a)
	hostB, okB := hostPort(b)
	return okA && okB && hostA == hostB
}

func hostPort(raw string) (string, bool) {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || parsed.Host == "" {
		return "", false
	}
	host := strings.ToLower(parsed.Hostname())
	if host == "127.0.0.1" || host == "::1" {
		host = "localhost"
	}
	port := parsed.Port()
	if port == "" {
		if parsed.Scheme == "http" {
			port = "80"
		} else {
			port = "443"
		}
	}
	return host + ":" + port, true
}

// Import applies the bundle to the named tenant.
func (c *localControlPlane) Import(ctx context.Context, deploymentID string,
	req thunder.ImportRequest) (*thunder.ImportResponse, error) {
	if c.importService == nil {
		return nil, fmt.Errorf("this server hosts no import service")
	}

	// The request is re-encoded rather than copied field by field. The two types describe the same
	// wire document, and listing the fields here meant a request could carry something this dropped on
	// the floor: the deletions that make writing an older version remove what a newer one added went
	// missing exactly that way, leaving a restore that only ever added and updated.
	var importReq importer.ImportRequest
	if err := reencode(req, &importReq); err != nil {
		return nil, fmt.Errorf("failed to prepare the import: %w", err)
	}

	// The deployment is the only thing that changes: everything the import does afterwards reads the
	// tenant from the context, so this is what makes the write land in the destination tenant.
	scoped := deployment.WithID(ctx, deploymentID)
	resp, svcErr := c.importService.ImportResources(scoped, &importReq)
	if svcErr != nil {
		return nil, fmt.Errorf("import into tenant %s failed: %s", deploymentID, svcErr.ErrorDescription)
	}
	return toThunderImportResponse(resp)
}

// toThunderImportResponse converts the import service's response into the shape the environment
// manager reports, which is the same JSON the HTTP import returns.
func toThunderImportResponse(resp *importer.ImportResponse) (*thunder.ImportResponse, error) {
	if resp == nil {
		return nil, nil
	}
	raw, err := json.Marshal(resp)
	if err != nil {
		return nil, fmt.Errorf("failed to encode the import result: %w", err)
	}
	var out thunder.ImportResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("failed to read the import result: %w", err)
	}
	return &out, nil
}

// localControlPlaneURL is where this server answers, preferring the public URL it advertises and
// falling back to its own host and port.
func localControlPlaneURL(cfg config.Config) string {
	if url := strings.TrimSpace(cfg.Server.PublicURL); url != "" {
		return url
	}
	return fmt.Sprintf("https://%s:%d", cfg.Server.Hostname, cfg.Server.Port)
}
