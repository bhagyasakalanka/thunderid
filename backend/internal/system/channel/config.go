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

package channel

import "time"

// ServerConfig configures the Control Plane channel server. It is decoupled from system/config; the
// cmd wiring maps the deployment config into it.
type ServerConfig struct {
	// Enabled turns the channel server on. When false, InitializeServer registers nothing.
	Enabled bool
	// Path is the route the WebSocket server is mounted on (for example "/cp/connect").
	Path string
	// AuthToken is the shared bearer token a Data Plane must present during the handshake.
	AuthToken string
	// ReadLimit is the max single-message size in bytes. Zero uses the coder/websocket default of
	// 32 KiB (32768 bytes); raise it for deployments that exchange larger JSON-RPC payloads.
	ReadLimit int64
	// RPCTimeout bounds a single CallMethod round-trip when the caller context has no deadline.
	// Zero means no fallback timeout (the caller context governs).
	RPCTimeout time.Duration
}

// ClientConfig configures the Data Plane channel client.
type ClientConfig struct {
	// Enabled turns the channel client on. When false, InitializeClient returns nil.
	Enabled bool
	// ID is this Data Plane's identifier, sent in the handshake and used as the CP registry key.
	ID string
	// ControlPlaneURL is the wss:// (or ws://) endpoint of the Control Plane channel server.
	ControlPlaneURL string
	// AuthToken is the shared bearer token presented during the handshake.
	AuthToken string
	// ReadLimit is the max single-message size in bytes. Zero uses the coder/websocket default of
	// 32 KiB (32768 bytes); raise it for deployments that exchange larger JSON-RPC payloads.
	ReadLimit int64
	// PingInterval is how often the client sends a transport ping to keep the connection alive.
	PingInterval time.Duration
	// ReconnectInitial and ReconnectMax bound the exponential-with-jitter reconnect backoff.
	ReconnectInitial time.Duration
	ReconnectMax     time.Duration
}
