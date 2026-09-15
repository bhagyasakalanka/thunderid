// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package plane

import "strings"

// runtimeRoutes are the paths that serve identity for end users: signing in, running a flow, issuing
// and validating a token, and the pages that do it. A control plane answers none of them, because it
// holds no users of its own and nobody signs in to it to reach an application.
var runtimeRoutes = []string{
	"/oauth2",
	"/flow",
	"/gate",
	"/authn",
	"/authzen",
	"/openid4vci",
	"/openid4vp",
	"/.well-known",
	"/register",
	"/userinfo",
	"/consent",
}

// authoringRoutes are the paths that design configuration for somewhere else: the versions captured
// here, the gateways they are applied to, and the values a gateway supplies. A data plane answers
// none of them, because configuration arrives at it rather than being written there.
var authoringRoutes = []string{
	"/versions",
	"/gateways",
}

// Serves reports whether this plane answers the given path.
//
// Anything named by neither list is configuration management, which every plane serves: a data plane
// administers itself, and a control plane has to hold the configuration it is designing.
func (p Plane) Serves(path string) bool {
	if matches(path, runtimeRoutes) {
		return p.ServesRuntime()
	}
	if matches(path, authoringRoutes) {
		return p.ServesAuthoring()
	}
	return true
}

// matches reports whether the path is one of the listed routes, or sits beneath one.
//
// A route matches its own path exactly or anything under its "/", and nothing else. Comparing by
// plain prefix would make "/versionsomething" a version route, which would refuse a path that has
// nothing to do with the one being named.
func matches(path string, routes []string) bool {
	trimmed := strings.TrimSuffix(path, "/")
	for _, route := range routes {
		if trimmed == route || strings.HasPrefix(path, route+"/") {
			return true
		}
	}
	return false
}
