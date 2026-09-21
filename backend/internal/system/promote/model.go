// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// Package promote copies one deployment's configuration into another.
//
// A single control plane holds the configuration of every environment it administers, separated by
// deployment id: dev, staging and production are three scopes in one database rather than three
// servers. Promoting is therefore an operation this server can perform on itself, reading one scope
// and writing another, with no network hop and no second copy of the configuration anywhere.
//
// It is expressed as an export followed by an import rather than as a row copy. Those two already
// know which resource types exist, what order their dependencies have to be written in, and how to
// invalidate the caches the stores keep. A copier that went at the tables directly would have to
// learn all three, and would fall behind the day a table was added.
package promote

// Request names the two deployments a promotion moves configuration between.
type Request struct {
	// From is the deployment the configuration is read from.
	From string `json:"from"`
	// To is the deployment the configuration is written to.
	To string `json:"to"`
	// DryRun reports what would be written without writing it.
	DryRun bool `json:"dryRun,omitempty"`
	// Resources narrows a promotion to the resources named. Empty promotes every configuration
	// resource the source holds, which is the ordinary case; naming them is for a caller that has
	// shown someone a diff and is carrying their answer, so that holding one resource back does not
	// mean holding the whole environment back.
	Resources []ResourceRef `json:"resources,omitempty"`
}

// ResourceRef names one resource to promote.
type ResourceRef struct {
	// Type is the resource type as the declarative resources name it, for example "application".
	Type string `json:"type"`
	// ID identifies the resource within its type.
	ID string `json:"id"`
}

// Response reports what a promotion did.
type Response struct {
	From string `json:"from"`
	To   string `json:"to"`
	// DryRun repeats what was asked, so a caller reading only the response can tell whether the
	// target was actually written.
	DryRun bool `json:"dryRun"`
	// Resources is how many resource documents were carried across.
	Resources int `json:"resources"`
	// Failures are the resources the import refused, named so a caller knows what did not arrive.
	// A promotion that fails part way still reports what did land, because the import is an upsert
	// per resource rather than one transaction.
	Failures []Failure `json:"failures,omitempty"`
}

// Failure is one resource an import refused.
type Failure struct {
	ResourceType string `json:"resourceType"`
	Name         string `json:"name,omitempty"`
	Reason       string `json:"reason"`
}
