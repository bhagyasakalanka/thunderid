// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package mcp

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"sync"
	"time"

	mcpsdk "github.com/modelcontextprotocol/go-sdk/mcp"

	"github.com/thunder-id/thunderid/internal/system/log"
)

// upstreamReadTimeout bounds reading the upstreams' tools or instructions, all of them at once, so an
// upstream that accepts the connection and never answers is left out rather than holding the
// listing. A tool call is not bounded by it: it runs as long as the caller's request does.
var upstreamReadTimeout = 10 * time.Second

var (
	// listingTTL is how long a caller's last listing routes its calls to upstream tools. Past it the
	// listing is read again, so a tool an upstream dropped is no longer routed to it.
	listingTTL = 5 * time.Minute
	// relistAfter is how recent a caller's listing must be for a call to a tool it does not name to be
	// answered as unknown without listing again. A caller cannot make every upstream be read more
	// often than this by calling names that do not exist.
	relistAfter = 30 * time.Second
	// instructionsTTL is how long an upstream's instructions are kept once read, so a change to them
	// is picked up without a restart.
	instructionsTTL = 5 * time.Minute
	// instructionsRetryAfter is how long an upstream whose instructions could not be read is left out
	// before they are read again, so one that hangs does not hold every client's connection.
	instructionsRetryAfter = 30 * time.Second
)

const (
	methodInitialize = "initialize"
	methodDiscover   = "server/discover"
	methodListTools  = "tools/list"
	methodCallTool   = "tools/call"
)

// upstreams serves the tools of other MCP servers beside this one's own, so a client connects to one
// server for both. A deployment that adds its own tools, such as one that knows environments this
// server does not, runs them as an upstream rather than as a second server its clients connect to.
//
// Nothing is read from an upstream until a client asks, because an upstream answers only a caller
// with a token: listing the tools reads each upstream's with the caller's token, and a call to an
// upstream tool is forwarded with it. An upstream tool named like one of this server's own is not
// served, so it cannot stand in for one.
//
// What an upstream tells a client about using its tools, its instructions, follows this server's own,
// so a client learns how the tools work together, such as deploying what it configured, from the one
// server it connects to. Instructions describe the upstream, not the caller, so they are kept for
// every caller once read.
type upstreams struct {
	endpoints []upstreamEndpoint
	// local are the names of this server's own tools.
	local  map[string]bool
	client *http.Client
	logger *log.Logger

	mu sync.Mutex
	// listings is, for each caller, which upstream serves each tool as that caller's last listing
	// found. Upstreams may answer callers differently, so one caller's listing never routes another's
	// calls. Callers are keyed by a hash of their Authorization header, never by the token itself.
	listings map[string]callerListing
	// instructions are each upstream's instructions, or the failure to read them, with when.
	instructions map[string]readInstructions
}

// upstreamEndpoint is one configured upstream: the URL calls go to, and the host its log lines name, so
// nothing else of the URL reaches the log.
type upstreamEndpoint struct {
	url  string
	host string
}

// callerListing is one caller's last listing: the upstream serving each tool, and when it was read.
type callerListing struct {
	owners map[string]string
	at     time.Time
}

// readInstructions is the outcome of reading one upstream's instructions.
type readInstructions struct {
	text   string
	failed bool
	at     time.Time
}

func newUpstreams(urls []string, local map[string]bool) *upstreams {
	endpoints := make([]upstreamEndpoint, 0, len(urls))
	for _, raw := range urls {
		host := raw
		if parsed, err := url.Parse(raw); err == nil {
			host = parsed.Host
		}
		endpoints = append(endpoints, upstreamEndpoint{url: raw, host: host})
	}
	return &upstreams{
		endpoints:    endpoints,
		local:        local,
		client:       &http.Client{},
		logger:       log.GetLogger().With(log.String(log.LoggerKeyComponentName, "MCPUpstreams")),
		listings:     map[string]callerListing{},
		instructions: map[string]readInstructions{},
	}
}

// middleware adds the upstream tools to a listing and forwards a call to one.
func (u *upstreams) middleware(next mcpsdk.MethodHandler) mcpsdk.MethodHandler {
	return func(ctx context.Context, method string, req mcpsdk.Request) (mcpsdk.Result, error) {
		switch method {
		case methodInitialize, methodDiscover:
			result, err := next(ctx, method, req)
			if err != nil {
				return result, err
			}
			added := u.instructionsFor(ctx, authorizationOf(req))
			switch answer := result.(type) {
			case *mcpsdk.InitializeResult:
				answer.Instructions = joinInstructions(answer.Instructions, added)
			case *mcpsdk.DiscoverResult:
				answer.Instructions = joinInstructions(answer.Instructions, added)
			}
			return result, nil
		case methodListTools:
			result, err := next(ctx, method, req)
			if err != nil {
				return result, err
			}
			listed, ok := result.(*mcpsdk.ListToolsResult)
			// The upstream tools follow this server's own, on the last page.
			if !ok || listed.NextCursor != "" {
				return result, nil
			}
			listed.Tools = append(listed.Tools, u.list(ctx, authorizationOf(req))...)
			return listed, nil
		case methodCallTool:
			call, ok := req.(*mcpsdk.CallToolRequest)
			if !ok || call.Params == nil || u.local[call.Params.Name] {
				return next(ctx, method, req)
			}
			authorization := authorizationOf(req)
			endpoint, found, recent := u.ownerOf(authorization, call.Params.Name)
			if !found && !recent {
				// A client may call a tool it learned of in an earlier session; listing finds its upstream.
				u.list(ctx, authorization)
				endpoint, found, _ = u.ownerOf(authorization, call.Params.Name)
			}
			if !found {
				return next(ctx, method, req)
			}
			return u.call(ctx, endpoint, authorization, call.Params)
		default:
			return next(ctx, method, req)
		}
	}
}

// list reads every upstream's tools with the caller's token, all at once under one deadline, and
// records which upstream serves each for this caller. An upstream that cannot be read is left out of
// the listing, so the server's own tools are still served while it is down. Where two upstreams name
// the same tool, the one configured first serves it.
func (u *upstreams) list(ctx context.Context, authorization string) []*mcpsdk.Tool {
	read := make([][]*mcpsdk.Tool, len(u.endpoints))
	u.eachUpstream(ctx, func(ctx context.Context, i int, endpoint upstreamEndpoint) {
		listed, err := u.listOne(ctx, endpoint.url, authorization)
		if err != nil {
			u.logger.Warn(ctx, "Failed to list an upstream MCP server's tools", log.String("upstream", endpoint.host),
				log.Error(err))
			return
		}
		read[i] = listed
	})

	var tools []*mcpsdk.Tool
	owners := map[string]string{}
	for i, listed := range read {
		for _, tool := range listed {
			if u.local[tool.Name] || owners[tool.Name] != "" {
				continue
			}
			owners[tool.Name] = u.endpoints[i].url
			tools = append(tools, tool)
		}
	}

	now := time.Now()
	u.mu.Lock()
	for caller, listing := range u.listings {
		if now.Sub(listing.at) > listingTTL {
			delete(u.listings, caller)
		}
	}
	u.listings[callerKey(authorization)] = callerListing{owners: owners, at: now}
	u.mu.Unlock()
	return tools
}

// eachUpstream runs read for every upstream at once, all under one upstreamReadTimeout, and returns when
// every read has.
func (u *upstreams) eachUpstream(ctx context.Context,
	read func(ctx context.Context, i int, endpoint upstreamEndpoint)) {
	ctx, cancel := context.WithTimeout(ctx, upstreamReadTimeout)
	defer cancel()
	var wg sync.WaitGroup
	for i, endpoint := range u.endpoints {
		wg.Add(1)
		go func() {
			defer wg.Done()
			read(ctx, i, endpoint)
		}()
	}
	wg.Wait()
}

func (u *upstreams) listOne(ctx context.Context, endpoint, authorization string) ([]*mcpsdk.Tool, error) {
	session, err := u.connect(ctx, endpoint, authorization, upstreamReadTimeout)
	if err != nil {
		return nil, err
	}
	defer func() { _ = session.Close() }()
	var tools []*mcpsdk.Tool
	for tool, err := range session.Tools(ctx, nil) {
		if err != nil {
			return nil, err
		}
		tools = append(tools, tool)
	}
	return tools, nil
}

// instructionsFor is every upstream's instructions, in the order the upstreams are configured. Those
// not read within instructionsTTL are read again with the caller's token, all at once; an upstream
// that could not be read is left out, and not read again until instructionsRetryAfter has passed.
func (u *upstreams) instructionsFor(ctx context.Context, authorization string) []string {
	now := time.Now()
	texts := make([]string, len(u.endpoints))
	var stale []int
	u.mu.Lock()
	for i, endpoint := range u.endpoints {
		known, ok := u.instructions[endpoint.url]
		switch {
		case ok && known.failed && now.Sub(known.at) < instructionsRetryAfter:
		case ok && !known.failed && now.Sub(known.at) < instructionsTTL:
			texts[i] = known.text
		default:
			stale = append(stale, i)
		}
	}
	u.mu.Unlock()

	if len(stale) > 0 {
		readNow := make(map[int]readInstructions, len(stale))
		var mu sync.Mutex
		u.eachUpstream(ctx, func(ctx context.Context, i int, endpoint upstreamEndpoint) {
			if !slices.Contains(stale, i) {
				return
			}
			text, err := u.readInstructions(ctx, endpoint.url, authorization)
			if err != nil {
				u.logger.Warn(ctx, "Failed to read an upstream MCP server's instructions",
					log.String("upstream", endpoint.host), log.Error(err))
			}
			mu.Lock()
			readNow[i] = readInstructions{text: text, failed: err != nil, at: time.Now()}
			mu.Unlock()
		})
		u.mu.Lock()
		for i, read := range readNow {
			u.instructions[u.endpoints[i].url] = read
			texts[i] = read.text
		}
		u.mu.Unlock()
	}

	var all []string
	for _, text := range texts {
		if text != "" {
			all = append(all, text)
		}
	}
	return all
}

func (u *upstreams) readInstructions(ctx context.Context, endpoint, authorization string) (string, error) {
	session, err := u.connect(ctx, endpoint, authorization, upstreamReadTimeout)
	if err != nil {
		return "", err
	}
	defer func() { _ = session.Close() }()
	if result := session.InitializeResult(); result != nil {
		return strings.TrimSpace(result.Instructions), nil
	}
	return "", nil
}

// joinInstructions puts the upstreams' instructions after the server's own, a paragraph apart.
func joinInstructions(own string, added []string) string {
	parts := make([]string, 0, len(added)+1)
	if own = strings.TrimSpace(own); own != "" {
		parts = append(parts, own)
	}
	parts = append(parts, added...)
	return strings.Join(parts, "\n\n")
}

// ownerOf is the upstream serving the named tool to this caller, by the caller's last listing, and
// whether that listing was read within relistAfter. A listing older than listingTTL names nothing.
func (u *upstreams) ownerOf(authorization, name string) (endpoint string, found, recent bool) {
	u.mu.Lock()
	defer u.mu.Unlock()
	listing, ok := u.listings[callerKey(authorization)]
	age := time.Since(listing.at)
	if !ok || age > listingTTL {
		return "", false, false
	}
	endpoint, found = listing.owners[name]
	return endpoint, found, age < relistAfter
}

// callerKey keys a caller's listing by a hash of its Authorization header, so no token is kept.
func callerKey(authorization string) string {
	sum := sha256.Sum256([]byte(authorization))
	return hex.EncodeToString(sum[:])
}

// call forwards a tool call to the upstream that serves the tool and answers with what it answered.
// It answers mcpsdk.Result rather than the call's own result type, so a failure is a nil interface and
// not a nil result inside one.
func (u *upstreams) call(ctx context.Context, endpoint, authorization string,
	params *mcpsdk.CallToolParamsRaw) (mcpsdk.Result, error) {
	session, err := u.connect(ctx, endpoint, authorization, 0)
	if err != nil {
		host := endpoint
		if parsed, parseErr := url.Parse(endpoint); parseErr == nil {
			host = parsed.Host
		}
		u.logger.Warn(ctx, "Failed to reach an upstream MCP server", log.String("upstream", host), log.Error(err))
		return toolFailure(fmt.Sprintf("the tool %s is not available right now", params.Name)), nil
	}
	defer func() { _ = session.Close() }()
	result, err := session.CallTool(ctx, &mcpsdk.CallToolParams{Name: params.Name, Arguments: params.Arguments})
	if err != nil {
		return nil, err
	}
	return result, nil
}

// connect opens a session with an upstream as the caller. A timeout bounds each HTTP request of the
// session, the notice the client sends when a request is cancelled included; zero leaves them
// unbounded, as a tool call is.
func (u *upstreams) connect(ctx context.Context, endpoint, authorization string,
	timeout time.Duration) (*mcpsdk.ClientSession, error) {
	client := mcpsdk.NewClient(&mcpsdk.Implementation{Name: "thunderid-mcp", Version: "1.0.0"}, nil)
	transport := &asCaller{base: u.client.Transport, authorization: authorization}
	return client.Connect(ctx, &mcpsdk.StreamableClientTransport{
		Endpoint: endpoint,
		// The caller's token is added below the client's redirect handling, so a redirect would carry it
		// to wherever the upstream points. It is not followed: the upstream answered with a redirect,
		// and is left out as one that cannot be read.
		HTTPClient: &http.Client{
			Transport: transport,
			Timeout:   timeout,
			CheckRedirect: func(*http.Request, []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
		MaxRetries:           -1,
		DisableStandaloneSSE: true,
	}, nil)
}

// asCaller sends each request with the caller's Authorization header.
type asCaller struct {
	base          http.RoundTripper
	authorization string
}

func (a *asCaller) RoundTrip(req *http.Request) (*http.Response, error) {
	base := a.base
	if base == nil {
		base = http.DefaultTransport
	}
	if a.authorization == "" {
		return base.RoundTrip(req)
	}
	forwarded := req.Clone(req.Context())
	forwarded.Header.Set("Authorization", a.authorization)
	return base.RoundTrip(forwarded)
}

// authorizationOf is the Authorization header the caller's request carried, which the guard already
// verified.
func authorizationOf(req mcpsdk.Request) string {
	extra := req.GetExtra()
	if extra == nil || extra.Header == nil {
		return ""
	}
	return strings.TrimSpace(extra.Header.Get("Authorization"))
}

func toolFailure(message string) *mcpsdk.CallToolResult {
	return &mcpsdk.CallToolResult{IsError: true, Content: []mcpsdk.Content{&mcpsdk.TextContent{Text: message}}}
}
