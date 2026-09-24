// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// Package gateway registers the data planes this control plane administers and applies the current
// configuration to them.
package gateway

import "time"

// Gateway is a data plane registered with this control plane.
//
// It is reached over its own API using the management token that data plane is configured with, so
// the control plane needs no inbound path to it and the data plane needs none to the control plane.
type Gateway struct {
	// ID identifies this registration, and is generated here when one is made. It is what the
	// gateway routes address, and it means nothing to the data plane.
	ID string `json:"id"`
	// Name is what an operator calls this gateway. It is also how a declared gateway is matched, so
	// re-reading the files updates the registration rather than making a second one.
	Name string `json:"name"`
	// BaseURL is where the data plane answers, and what says which data plane it is: one registers
	// once, so this is unique within the deployment.
	//
	// A data plane reached by more than one name can therefore be registered more than once, under
	// each of them. Nothing here can tell that they are the same deployment, so register the name the
	// control plane should call it by and leave the others alone.
	BaseURL string `json:"baseUrl"`
	// Key is the token this control plane presents to that data plane. It is generated here when the
	// gateway is registered, held encrypted, and returned only by the call that generated it.
	//
	// Whoever holds it can import configuration into that data plane and read and write its variable
	// store, so a read that returned it would hand every operator of this control plane the keys to
	// every data plane it administers.
	Key string `json:"-"`
	// CACertificate is a PEM certificate to trust when calling this data plane, in addition to the
	// system roots. It is for a data plane serving a certificate no public authority signed, which is
	// what a local or on-premise deployment usually has.
	//
	// Empty is the common case and the right default: a data plane behind an ingress with a
	// publicly-issued certificate verifies against the system roots with nothing configured here.
	// Naming the one certificate keeps verification on for that gateway, rather than a switch that
	// turns it off.
	CACertificate string `json:"caCertificate,omitempty"`
	// ManagedByControlPlane marks the one data plane this control plane administers directly, rather
	// than only applies configuration to.
	//
	// It decides where a value created here is placed. A credential is created once, and each data
	// plane holds its own, so writing one everywhere would put a credential made while developing
	// into production. It goes to this gateway alone; the others receive theirs when a configuration
	// is applied to them deliberately.
	//
	// Exactly one gateway holds it. The first one registered takes it, and it can be moved
	// afterwards by marking another.
	ManagedByControlPlane bool      `json:"managedByControlPlane,omitempty"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// KeyConfigured reports whether a key is held, which is all a read of one discloses.
func (g *Gateway) KeyConfigured() bool { return g.Key != "" }

// RegisterRequest is the body of a registration.
type RegisterRequest struct {
	Name          string `json:"name"`
	BaseURL       string `json:"baseUrl"`
	CACertificate string `json:"caCertificate,omitempty"`
}

// UpdateRequest changes a registration. Every field is optional: what is omitted is left as it is,
// so a caller can move a data plane's address without restating its certificate.
//
// BaseURL is updatable, but note that it is also what identifies the data plane: moving a gateway's
// address is how a data plane that moved is followed, and it is refused if another gateway already
// answers there.
//
// Key is absent for a different reason: replacing a credential is its own operation, with its own
// route, so it is not done by accident by a caller sending a whole object back.
type UpdateRequest struct {
	Name          *string `json:"name,omitempty"`
	BaseURL       *string `json:"baseUrl,omitempty"`
	CACertificate *string `json:"caCertificate,omitempty"`
}

// Registration is what a registration returns: the gateway, and the key once.
//
// The key appears here and nowhere else. It is generated when the gateway is registered, stored
// encrypted, and never read back, so this response is the only chance to put it on the data plane.
// Lose it and the way forward is to rotate, not to look it up.
type Registration struct {
	Gateway
	Key string `json:"key"`
}
