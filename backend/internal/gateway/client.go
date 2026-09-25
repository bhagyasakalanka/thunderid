// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package gateway

import (
	"bytes"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/thunder-id/thunderid/internal/system/constants"
	"github.com/thunder-id/thunderid/internal/system/valueref"
)

// clientTimeout bounds a single call to a gateway. A resource is created while these are in flight,
// so it is short enough that an unreachable gateway fails the request rather than holding it open.
const clientTimeout = 10 * time.Second

// ErrNotFound is returned when the gateway does not hold the name asked for.
var ErrNotFound = errors.New("the gateway does not hold that value")

// ErrUnauthorized is returned when the gateway refuses the key registered for it. It is a
// configuration fault rather than a transient one: retrying with the same key cannot succeed.
var ErrUnauthorized = errors.New("the gateway refused the registered key")

// Client calls one gateway's value store.
//
// A control plane authors configuration but does not hold the values that configuration refers to.
// A credential or a deployment-specific value belongs to the gateway that runs it, so the control
// plane writes it there as the resource is created and keeps only a reference.
//
// Every call presents the key registered for that gateway. That key is what the gateway accepts on
// its value store routes, so no separate credential exists for this.
type Client struct {
	baseURL string
	key     string
	http    *http.Client
}

// NewClient builds a client for the gateway at baseURL, presenting key.
//
// caCertificate is a PEM certificate to trust in addition to the system roots, for a gateway
// serving a certificate no public authority signed. Empty means the system roots alone.
func NewClient(baseURL, key, caCertificate string) (*Client, error) {
	trimmed := strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if trimmed == "" {
		return nil, errors.New("a gateway address is required")
	}
	parsed, err := url.Parse(trimmed)
	if err != nil || parsed.Host == "" {
		return nil, fmt.Errorf("the gateway address is not usable: %s", baseURL)
	}

	transport, err := transportFor(caCertificate)
	if err != nil {
		return nil, err
	}
	return &Client{
		baseURL: trimmed,
		key:     key,
		http:    &http.Client{Timeout: clientTimeout, Transport: transport},
	}, nil
}

// transportFor builds the transport, trusting caCertificate in addition to the system roots.
func transportFor(caCertificate string) (http.RoundTripper, error) {
	pem := strings.TrimSpace(caCertificate)
	if pem == "" {
		return http.DefaultTransport, nil
	}
	roots, err := x509.SystemCertPool()
	if err != nil || roots == nil {
		roots = x509.NewCertPool()
	}
	if !roots.AppendCertsFromPEM([]byte(pem)) {
		return nil, errors.New("the gateway's certificate authority could not be read")
	}
	// #nosec G402 -- MinVersion is set; only the trust anchors differ from the default.
	return &http.Transport{TLSClientConfig: &tls.Config{RootCAs: roots, MinVersion: tls.VersionTLS12}}, nil
}

// Put writes a value, creating it when the name is unused and replacing it when it is not. The
// gateway's PUT is idempotent, so applying the same configuration twice leaves the same state.
func (c *Client) Put(ctx context.Context, collection valueref.Collection, name, value, description string) error {
	segment, err := pathSegment(name)
	if err != nil {
		return err
	}
	body, err := json.Marshal(map[string]string{"value": value, "description": description})
	if err != nil {
		return fmt.Errorf("failed to build the request for %q: %w", name, err)
	}
	_, err = c.do(ctx, http.MethodPut, "/"+string(collection)+"/"+segment, body)
	return err
}

// GetVariable reads a variable's value.
//
// There is no GetSecret: a gateway never returns a secret's value, only whether it holds one, so
// there would be nothing for a caller to do with the answer.
func (c *Client) GetVariable(ctx context.Context, name string) (string, error) {
	segment, err := pathSegment(name)
	if err != nil {
		return "", err
	}
	raw, err := c.do(ctx, http.MethodGet, "/"+string(valueref.CollectionVariable)+"/"+segment, nil)
	if err != nil {
		return "", err
	}
	var body struct {
		Value string `json:"value"`
	}
	if err := json.Unmarshal(raw, &body); err != nil {
		return "", fmt.Errorf("failed to read the value of %q: %w", name, err)
	}
	return body.Value, nil
}

// Delete removes a value. A name the gateway does not hold is not an error: the value is already
// gone, which is the state the caller wanted.
func (c *Client) Delete(ctx context.Context, collection valueref.Collection, name string) error {
	segment, err := pathSegment(name)
	if err != nil {
		return err
	}
	_, err = c.do(ctx, http.MethodDelete, "/"+string(collection)+"/"+segment, nil)
	if errors.Is(err, ErrNotFound) {
		return nil
	}
	return err
}

// do issues one request and maps the response to an error a caller can act on.
func (c *Client) do(ctx context.Context, method, path string, body []byte) ([]byte, error) {
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, reader)
	if err != nil {
		return nil, fmt.Errorf("failed to build a gateway request: %w", err)
	}
	req.Header.Set(constants.APIKeyHeaderName, c.key)
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("the gateway could not be reached: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	raw, readErr := io.ReadAll(resp.Body)
	switch {
	case resp.StatusCode == http.StatusNotFound:
		return nil, ErrNotFound
	case resp.StatusCode == http.StatusUnauthorized, resp.StatusCode == http.StatusForbidden:
		return nil, ErrUnauthorized
	case resp.StatusCode < 200 || resp.StatusCode >= 300:
		return nil, fmt.Errorf("the gateway answered %d for %s %s", resp.StatusCode, method, path)
	}
	if readErr != nil {
		return nil, fmt.Errorf("failed to read the gateway's response: %w", readErr)
	}
	return raw, nil
}

// pathSegment escapes a name for use as one path segment.
//
// A name is derived from a resource's own fields, so it is not necessarily well formed. Without
// escaping, one carrying a slash or a traversal sequence would address something other than the
// value it names.
func pathSegment(name string) (string, error) {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return "", errors.New("a value name is required")
	}
	escaped := url.PathEscape(trimmed)
	if escaped == "." || escaped == ".." {
		return "", fmt.Errorf("a value name is not usable: %s", name)
	}
	return escaped, nil
}
