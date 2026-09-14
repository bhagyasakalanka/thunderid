// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// Package parameterise carries whether the current request is authoring a parameterised payload
// rather than a live resource.
//
// A control plane authors configuration that is applied somewhere else, so a field which must hold a
// real value on a gateway may hold a placeholder there: a redirect URI of "{{.CALLBACK_URL}}" is
// meaningful to author and impossible to validate. A gateway has no such case, and validates
// everything strictly, which is what it does today.
//
// The mode travels on the context rather than through a parameter on every validation signature.
// That keeps one implementation of each validator for both planes: a gateway never sets the flag, so
// its behavior is byte for byte what it was, and a control plane sets it once at its own API edge.
package parameterise

import (
	"context"
	"regexp"
	"strings"

	"github.com/thunder-id/thunderid/internal/system/varname"
)

// ctxKey is the private context key under which the parameterised mode is stored.
type ctxKey struct{}

// WithMode returns a context marked as authoring a parameterised payload. A control plane sets this
// at its API edge; nothing else should.
func WithMode(ctx context.Context) context.Context {
	return context.WithValue(ctx, ctxKey{}, true)
}

// Enabled reports whether this request is authoring a parameterised payload.
//
// A validator calls this to decide whether a placeholder is acceptable in place of a real value. It
// is false for every request that did not pass through a control plane's authoring API, including
// every request on a gateway, so strict validation stays the default.
func Enabled(ctx context.Context) bool {
	enabled, ok := ctx.Value(ctxKey{}).(bool)
	return ok && enabled
}

// templatePattern matches a template variable such as {{.CALLBACK_URL}}, allowing the surrounding
// whitespace text/template permits.
var templatePattern = regexp.MustCompile(`\{\{\s*\.?\s*[A-Za-z_][A-Za-z0-9_]*\s*\}\}`)

// Placeholder renders the template variable that stands in for a named value, which is what a
// parameterised payload carries in place of one deployment's value.
func Placeholder(name string) string { return "{{." + name + "}}" }

// IsPlaceholder reports whether a value stands in for something supplied later, either a template
// variable or a secret reference. Such a value cannot be validated as the thing it represents.
func IsPlaceholder(value string) bool {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return false
	}
	return varname.IsReference(trimmed) || templatePattern.MatchString(trimmed)
}

// ContainsPlaceholder reports whether any of the given values is a placeholder. It is the form a
// validator wants when a field holds a list, such as redirect URIs.
func ContainsPlaceholder(values []string) bool {
	for _, value := range values {
		if IsPlaceholder(value) {
			return true
		}
	}
	return false
}

// Skip reports whether a validator should pass over this value: the request is authoring a
// parameterised payload and the value is a placeholder rather than the real thing.
//
// Both halves matter. Outside authoring a placeholder is just an invalid value and is rejected as
// one, so a gateway cannot be handed "{{.CALLBACK_URL}}" and store it.
func Skip(ctx context.Context, value string) bool {
	return Enabled(ctx) && IsPlaceholder(value)
}
