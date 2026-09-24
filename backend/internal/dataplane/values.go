// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package dataplane

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/thunder-id/thunderid/internal/gateway"
	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"

	"github.com/thunder-id/thunderid/internal/system/log"
	"github.com/thunder-id/thunderid/internal/system/valueref"
	"github.com/thunder-id/thunderid/internal/system/varname"
)

// ValuesInterface is what a service uses to keep a value out of the control plane's database.
//
// A service calls Place as it stores a resource, and Resolve as it reads one back. Everything
// between the two, including which data plane is written to and how it is reached, is here rather
// than in each service.
type ValuesInterface interface {
	// Place writes a value to the data plane this control plane administers and returns the
	// reference to store in its place.
	//
	// It fails rather than storing anything when the data plane cannot be reached. A resource whose
	// credential was never placed would be stored referring to a value that does not exist, and
	// would fail at the moment it was used rather than the moment it was created.
	Place(ctx context.Context, collection valueref.Collection,
		resourceType, resourceName, field, value string) (string, *tidcommon.ServiceError)
	// Resolve returns what a stored value names.
	//
	// A value that is not a reference is returned unchanged. A secret reference is returned
	// unchanged too: a data plane never gives a secret's value back, so there is nothing to put in
	// its place, and the reference is what a caller displays.
	Resolve(ctx context.Context, stored string) (string, *tidcommon.ServiceError)
}

// values reaches the managed data plane's value store.
type values struct {
	gateways gateway.ServiceInterface
	logger   *log.Logger

	// mu guards the memoized client. The gateway it is built from changes only when an operator
	// re-registers or rotates, which is rare, so the client is built once and rebuilt when the
	// address or key it was built from no longer matches.
	mu      sync.Mutex
	client  *Client
	builtAt string
}

// NewValues builds the value placer for a control plane.
func NewValues(gateways gateway.ServiceInterface) ValuesInterface {
	return &values{
		gateways: gateways,
		logger:   log.GetLogger().With(log.String("component", "DataPlaneValues")),
	}
}

func (v *values) Place(ctx context.Context, collection valueref.Collection,
	resourceType, resourceName, field, value string) (string, *tidcommon.ServiceError) {
	name := varname.DeriveVariableName(resourceType, resourceName, field)

	client, svcErr := v.clientFor(ctx)
	if svcErr != nil {
		return "", svcErr
	}

	description := fmt.Sprintf("%s %q, %s", resourceType, resourceName, field)
	if err := client.Put(ctx, Collection(collection), name, value, description); err != nil {
		return "", v.asServiceError(ctx, err, "place", name)
	}

	if collection == valueref.CollectionSecret {
		return valueref.Secret(name), nil
	}
	return valueref.Variable(name), nil
}

func (v *values) Resolve(ctx context.Context, stored string) (string, *tidcommon.ServiceError) {
	collection, name, isReference := valueref.Parse(stored)
	if !isReference || collection == valueref.CollectionSecret {
		return stored, nil
	}

	client, svcErr := v.clientFor(ctx)
	if svcErr != nil {
		return "", svcErr
	}

	value, err := client.GetVariable(ctx, name)
	if err != nil {
		// A name the data plane does not hold is not a failure to read: the reference is what the
		// control plane has, and returning it unchanged keeps a resource readable rather than
		// failing every read because one value was removed there.
		if errors.Is(err, ErrNotFound) {
			v.logger.Warn(ctx, "The data plane does not hold a referenced value",
				log.String("name", name))
			return stored, nil
		}
		return "", v.asServiceError(ctx, err, "resolve", name)
	}
	return value, nil
}

// clientFor returns a client for the managed data plane, rebuilding it when the registration it was
// built from has changed.
func (v *values) clientFor(ctx context.Context) (*Client, *tidcommon.ServiceError) {
	managed, svcErr := v.gateways.Managed(ctx)
	if svcErr != nil {
		return nil, svcErr
	}

	v.mu.Lock()
	defer v.mu.Unlock()
	fingerprint := managed.BaseURL + "\x00" + managed.Key + "\x00" + managed.CACertificate
	if v.client != nil && v.builtAt == fingerprint {
		return v.client, nil
	}

	client, err := New(managed.BaseURL, managed.Key, managed.CACertificate)
	if err != nil {
		v.logger.Error(ctx, "Failed to build a client for the managed data plane", log.Error(err))
		return nil, &ErrorDataPlaneUnusable
	}
	v.client, v.builtAt = client, fingerprint
	return client, nil
}

// asServiceError turns a transport failure into the error a caller reports.
func (v *values) asServiceError(ctx context.Context, err error, action, name string) *tidcommon.ServiceError {
	if errors.Is(err, ErrUnauthorized) {
		v.logger.Error(ctx, "The managed data plane refused this control plane's token",
			log.String("action", action), log.String("name", name))
		return &ErrorDataPlaneRefusedTheToken
	}
	v.logger.Error(ctx, "Failed to reach the managed data plane",
		log.String("action", action), log.String("name", name), log.Error(err))
	return &ErrorDataPlaneUnreachable
}
