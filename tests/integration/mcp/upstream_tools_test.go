// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package mcp

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"sync"
)

const (
	fakeToolName     = "list_environments"
	fakeInstructions = "Deploy what you configure with deploy_to_environment."
)

// fakeUpstream is a minimal MCP server over streamable HTTP: it answers initialize, tools/list and
// tools/call as JSON, and records the Authorization header each request carried.
type fakeUpstream struct {
	mu             sync.Mutex
	authorizations []string
	called         []string
}

func (f *fakeUpstream) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var message struct {
		ID     json.RawMessage `json:"id"`
		Method string          `json:"method"`
		Params json.RawMessage `json:"params"`
	}
	body, _ := io.ReadAll(r.Body)
	if json.Unmarshal(body, &message) != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	f.mu.Lock()
	f.authorizations = append(f.authorizations, r.Header.Get("Authorization"))
	f.mu.Unlock()
	if len(message.ID) == 0 {
		w.WriteHeader(http.StatusAccepted)
		return
	}

	var result any
	switch message.Method {
	case "initialize":
		var params struct {
			ProtocolVersion string `json:"protocolVersion"`
		}
		_ = json.Unmarshal(message.Params, &params)
		result = map[string]any{
			"protocolVersion": params.ProtocolVersion,
			"capabilities":    map[string]any{"tools": map[string]any{}},
			"serverInfo":      map[string]any{"name": "fake-environments", "version": "1.0.0"},
			"instructions":    fakeInstructions,
		}
	case "tools/list":
		result = map[string]any{"tools": []any{map[string]any{
			"name": fakeToolName, "description": "Lists environments.",
			"inputSchema": map[string]any{"type": "object"},
		}}}
	case "tools/call":
		var params struct {
			Name      string         `json:"name"`
			Arguments map[string]any `json:"arguments"`
		}
		_ = json.Unmarshal(message.Params, &params)
		f.mu.Lock()
		f.called = append(f.called, params.Name)
		f.mu.Unlock()
		result = map[string]any{
			"content":           []any{map[string]any{"type": "text", "text": "listed"}},
			"structuredContent": map[string]any{"environments": []any{"dev", "prod"}, "asked": params.Arguments},
		}
	default:
		writeRPC(w, message.ID, nil, map[string]any{"code": -32601, "message": "method not found"})
		return
	}
	writeRPC(w, message.ID, result, nil)
}

func writeRPC(w http.ResponseWriter, id json.RawMessage, result, rpcError any) {
	answer := map[string]any{"jsonrpc": "2.0", "id": id}
	if rpcError != nil {
		answer["error"] = rpcError
	} else {
		answer["result"] = result
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(answer)
}

func (f *fakeUpstream) seen() ([]string, []string) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]string(nil), f.authorizations...), append([]string(nil), f.called...)
}

// listMCPTools sends a stateless tools/list request and returns the raw answer.
func (ts *MCPTestSuite) listMCPTools(token string) string {
	payload := `{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{"_meta":{` +
		`"io.modelcontextprotocol/protocolVersion":"` + mcpProtocolVersion20260728 + `",` +
		`"io.modelcontextprotocol/clientCapabilities":{},` +
		`"io.modelcontextprotocol/clientInfo":{"name":"thunderid-integration-test","version":"1.0.0"}}}}`
	req, err := http.NewRequest(http.MethodPost, mcpEndpoint, bytes.NewBufferString(payload))
	ts.Require().NoError(err)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, text/event-stream")
	req.Header.Set("MCP-Protocol-Version", mcpProtocolVersion20260728)
	req.Header.Set("Mcp-Method", "tools/list")
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := ts.client.Do(req)
	ts.Require().NoError(err)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	ts.Require().Equalf(http.StatusOK, resp.StatusCode, "tools/list failed: %s", string(body))
	return string(body)
}

// The server's listing carries the upstream's tools after its own, read with the caller's token, and
// leaves out an upstream that redirects or cannot be reached.
func (ts *MCPTestSuite) TestUpstreamTools_ListedBesideTheServersOwn() {
	token := ts.mcpScopedAdminToken()

	listed := ts.listMCPTools(token)

	ts.Contains(listed, `"`+fakeToolName+`"`)
	ts.Contains(listed, `"thunderid_list_applications"`, "the server's own tools are listed too")
	ts.NotContains(listed, "thunderid_integration_excluded_tool")
	authorizations, _ := fake.seen()
	ts.Contains(authorizations, "Bearer "+token, "the upstream was not read with the caller's token")
}

// A call to an upstream tool is forwarded to the upstream with the caller's token, and answered as the
// upstream answered.
func (ts *MCPTestSuite) TestUpstreamTools_CallIsForwardedAsTheCaller() {
	token := ts.mcpScopedAdminToken()

	result, raw := ts.callMCPTool(token, fakeToolName, map[string]any{"project": "core"})

	ts.Require().Falsef(result.Result.IsError, "the call failed: %s", raw)
	ts.Equal([]any{"dev", "prod"}, result.Result.StructuredContent["environments"])
	ts.Equal(map[string]any{"project": "core"}, result.Result.StructuredContent["asked"])
	_, called := fake.seen()
	ts.Contains(called, fakeToolName)

	// A name neither the server nor an upstream serves is unknown, after the upstreams were asked.
	ts.Contains(ts.callUnknownTool(token, "no_such_upstream_tool"), `unknown tool`)
}

// callUnknownTool calls a tool no server serves and returns the raw answer, a JSON-RPC error.
func (ts *MCPTestSuite) callUnknownTool(token, name string) string {
	payload := `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"` + name + `","arguments":{},` +
		`"_meta":{"io.modelcontextprotocol/protocolVersion":"` + mcpProtocolVersion20260728 + `",` +
		`"io.modelcontextprotocol/clientCapabilities":{},` +
		`"io.modelcontextprotocol/clientInfo":{"name":"thunderid-integration-test","version":"1.0.0"}}}}`
	req, err := http.NewRequest(http.MethodPost, mcpEndpoint, bytes.NewBufferString(payload))
	ts.Require().NoError(err)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, text/event-stream")
	req.Header.Set("MCP-Protocol-Version", mcpProtocolVersion20260728)
	req.Header.Set("Mcp-Method", "tools/call")
	req.Header.Set("Mcp-Name", name)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := ts.client.Do(req)
	ts.Require().NoError(err)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return string(body)
}

// A client learns how the upstream's tools are used from the one server it connects to: the upstream's
// instructions follow the server's own.
func (ts *MCPTestSuite) TestUpstreamTools_InstructionsAreGivenWithTheServersOwn() {
	token := ts.mcpScopedAdminToken()

	resp := ts.initializeMCPSession(token)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	ts.Require().Equalf(http.StatusOK, resp.StatusCode, "initialize failed: %s", string(body))
	ts.Contains(string(body), fakeInstructions)
}
