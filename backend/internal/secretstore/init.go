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

// Package secretstore serves the credentials a data plane resolves its kv: references from. It is
// the standalone secret provider service brought in-process, so a deployment can run without a
// separate service; the standalone one still exists and is unchanged.
package secretstore

import (
	"net/http"
	"strings"
)

// basePath keeps these routes clear of /secrets, which the configuration secret service already
// serves with a different model: that one holds encrypted values for an operator to reveal, while
// this one holds hashes to verify against and values to replay.
const basePath = "/secret-store"

// Initialize mounts the secret store on the given mux and returns the store behind it.
//
// A blank file path disables the module and registers nothing, which is what a deployment pointing
// at the standalone provider (or at no provider at all) wants.
//
// No shared bearer token is configured here. The standalone service guards itself with one because
// it is reachable on its own; mounted here the route sits behind this server's management-API
// authentication, and requiring a second, different token as well would mean no caller could
// satisfy both at once.
func Initialize(mux *http.ServeMux, filePath string) (*Store, error) {
	if strings.TrimSpace(filePath) == "" {
		return nil, nil
	}

	store, err := NewStore(filePath)
	if err != nil {
		return nil, err
	}

	server := NewStoreServer(store, "")
	registerRoutes(mux, server)
	return store, nil
}

// registerRoutes mounts the store's own handler under basePath. The handler builds its routes on an
// internal mux, so it is stripped of the prefix before being handed the request.
func registerRoutes(mux *http.ServeMux, server *StoreServer) {
	mux.Handle(basePath+"/", http.StripPrefix(basePath, server.Handler()))
}
