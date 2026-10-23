// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package mcp

import (
	"net"
	"net/http"
	"os"
	"testing"
)

// fake is the upstream MCP server the integration server is configured with
// (tests/integration/resources/deployment.yaml), on localhost:18496.
var fake = &fakeUpstream{}

// TestMain serves the configured upstreams before any test reaches /mcp, since the server keeps an
// upstream it could not read out of its answers for a while.
func TestMain(m *testing.M) {
	stop := serveOn("127.0.0.1:18496", fake)
	// The second upstream redirects to the first, which must not be followed with the caller's token.
	stopRedirect := serveOn("127.0.0.1:18497", http.RedirectHandler("http://localhost:18496/mcp",
		http.StatusTemporaryRedirect))
	code := m.Run()
	stop()
	stopRedirect()
	os.Exit(code)
}

// serveOn serves handler on address and returns what stops it.
func serveOn(address string, handler http.Handler) func() {
	listener, err := net.Listen("tcp", address)
	if err != nil {
		panic("cannot serve an upstream on " + address + ": " + err.Error())
	}
	server := &http.Server{Handler: handler} //nolint:gosec // test server
	go func() { _ = server.Serve(listener) }()
	return func() { _ = server.Close() }
}
