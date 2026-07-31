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

// EntityProviderInterface defines the boundary contract between the gateway layer and the
// directory layer for entity operations.
type EntityProviderInterface interface {
	// IdentifyEntity resolves an entity ID from indexed attribute filters (e.g., email, clientId).
	IdentifyEntity(ctx context.Context, filters map[string]interface{}) (*string, *EntityProviderError)

	// SearchEntities searches for all entities matching the given filters.
	SearchEntities(ctx context.Context, filters map[string]interface{}) ([]*providers.Entity, *EntityProviderError)

	// GetEntity retrieves an entity by ID. Credentials are never returned.
	GetEntity(ctx context.Context, entityID string) (*providers.Entity, *EntityProviderError)

	// CreateEntity creates a new entity.
	CreateEntity(ctx context.Context, entity *providers.Entity,
		systemCredentials json.RawMessage) (*providers.Entity, *EntityProviderError)

	// UpdateEntity updates an existing entity's core fields.
	UpdateEntity(ctx context.Context, entityID string, entity *providers.Entity) (*providers.Entity, *EntityProviderError)

	// DeleteEntity deletes an entity by ID. Cascades to identifiers.
	DeleteEntity(ctx context.Context, entityID string) *EntityProviderError

	// UpdateCredentials updates schema-defined credentials for an entity.
	UpdateCredentials(ctx context.Context, entityID string,
		credentials json.RawMessage) *EntityProviderError

	// UpdateAttributes updates schema-defined attributes for an entity.
	UpdateAttributes(ctx context.Context, entityID string,
		attributes json.RawMessage) *EntityProviderError

	// UpdateSystemAttributes updates system-managed attributes for an entity.
	UpdateSystemAttributes(ctx context.Context, entityID string,
		attributes json.RawMessage) *EntityProviderError

	// UpdateSystemCredentials updates system-managed credentials for an entity.
	UpdateSystemCredentials(ctx context.Context, entityID string,
		credentials json.RawMessage) *EntityProviderError

	// GetTransitiveEntityGroups retrieves all groups an entity belongs to, including inherited groups.
	GetTransitiveEntityGroups(ctx context.Context, entityID string) ([]providers.EntityGroup, *EntityProviderError)

	// ValidateEntityIDs validates that the given entity IDs exist. Returns IDs that are invalid.
	ValidateEntityIDs(ctx context.Context, entityIDs []string) ([]string, *EntityProviderError)

	// GetEntitiesByIDs retrieves multiple entities by their IDs.
	GetEntitiesByIDs(ctx context.Context, entityIDs []string) ([]providers.Entity, *EntityProviderError)

	// GetEntityListCount returns the total number of entities in the given category.
	GetEntityListCount(ctx context.Context, category providers.EntityCategory, filters map[string]interface{}) (int, *EntityProviderError)

	// GetEntityList returns a page of entities in the given category.
	GetEntityList(ctx context.Context, category providers.EntityCategory, limit, offset int,
		filters map[string]interface{}) ([]providers.Entity, *EntityProviderError)
}
