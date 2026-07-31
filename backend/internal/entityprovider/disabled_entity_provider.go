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

package entityprovider

import (
	"context"
	"encoding/json"

	"github.com/thunder-id/thunderid/pkg/thunderidengine/providers"
)

// errNotImplemented is the error returned when a method is not implemented.
var errNotImplemented = NewEntityProviderError(
	ErrorCodeNotImplemented,
	"Method Not Implemented",
	"The method is not implemented by the entity provider.",
)

// disabledEntityProvider is an entity provider that returns an error for all methods.
type disabledEntityProvider struct{}

// newDisabledEntityProvider creates a new disabled entity provider.
func newDisabledEntityProvider() EntityProviderInterface {
	return &disabledEntityProvider{}
}

func (p *disabledEntityProvider) IdentifyEntity(ctx context.Context,
	_ map[string]interface{}) (*string, *EntityProviderError) {
	return nil, errNotImplemented
}

func (p *disabledEntityProvider) SearchEntities(ctx context.Context,
	_ map[string]interface{}) ([]*providers.Entity, *EntityProviderError) {
	return nil, errNotImplemented
}

func (p *disabledEntityProvider) GetEntity(ctx context.Context,
	_ string) (*providers.Entity, *EntityProviderError) {
	return nil, errNotImplemented
}

func (p *disabledEntityProvider) CreateEntity(ctx context.Context, _ *providers.Entity,
	_ json.RawMessage) (*providers.Entity, *EntityProviderError) {
	return nil, errNotImplemented
}

func (p *disabledEntityProvider) UpdateEntity(ctx context.Context, _ string,
	_ *providers.Entity) (*providers.Entity, *EntityProviderError) {
	return nil, errNotImplemented
}

func (p *disabledEntityProvider) DeleteEntity(ctx context.Context, _ string) *EntityProviderError {
	return errNotImplemented
}

func (p *disabledEntityProvider) UpdateCredentials(ctx context.Context, _ string,
	_ json.RawMessage) *EntityProviderError {
	return errNotImplemented
}

func (p *disabledEntityProvider) UpdateAttributes(ctx context.Context, _ string,
	_ json.RawMessage) *EntityProviderError {
	return errNotImplemented
}

func (p *disabledEntityProvider) UpdateSystemAttributes(ctx context.Context, _ string,
	_ json.RawMessage) *EntityProviderError {
	return errNotImplemented
}

func (p *disabledEntityProvider) UpdateSystemCredentials(ctx context.Context, _ string,
	_ json.RawMessage) *EntityProviderError {
	return errNotImplemented
}

func (p *disabledEntityProvider) GetTransitiveEntityGroups(ctx context.Context,
	_ string) ([]providers.EntityGroup, *EntityProviderError) {
	return nil, errNotImplemented
}

func (p *disabledEntityProvider) ValidateEntityIDs(ctx context.Context,
	_ []string) ([]string, *EntityProviderError) {
	return nil, errNotImplemented
}

func (p *disabledEntityProvider) GetEntitiesByIDs(ctx context.Context,
	_ []string) ([]providers.Entity, *EntityProviderError) {
	return nil, errNotImplemented
}

func (p *disabledEntityProvider) GetEntityListCount(ctx context.Context,
	_ providers.EntityCategory, _ map[string]interface{}) (int, *EntityProviderError) {
	return 0, errNotImplemented
}

func (p *disabledEntityProvider) GetEntityList(ctx context.Context,
	_ providers.EntityCategory, _, _ int, _ map[string]interface{}) ([]providers.Entity, *EntityProviderError) {
	return nil, errNotImplemented
}
