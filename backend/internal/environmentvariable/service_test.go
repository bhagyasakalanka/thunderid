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

package environmentvariable

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"
)

// fakeStore is an in-memory environmentVariableStoreInterface.
type fakeStore struct {
	byID  map[string]EnvironmentVariable
	order []string
}

func newFakeStore() *fakeStore {
	return &fakeStore{byID: map[string]EnvironmentVariable{}}
}

func (s *fakeStore) CreateEnvironmentVariable(_ context.Context, ev EnvironmentVariable) error {
	s.byID[ev.ID] = ev
	s.order = append(s.order, ev.ID)
	return nil
}

func (s *fakeStore) GetEnvironmentVariableCount(_ context.Context) (int, error) {
	return len(s.byID), nil
}

func (s *fakeStore) GetEnvironmentVariableList(_ context.Context, limit,
	offset int) ([]EnvironmentVariable, error) {
	out := []EnvironmentVariable{}
	for i, id := range s.order {
		if i < offset {
			continue
		}
		if len(out) >= limit {
			break
		}
		out = append(out, s.byID[id])
	}
	return out, nil
}

func (s *fakeStore) GetEnvironmentVariableByID(_ context.Context, id string) (EnvironmentVariable, error) {
	ev, ok := s.byID[id]
	if !ok {
		return EnvironmentVariable{}, errEnvironmentVariableNotFound
	}
	return ev, nil
}

func (s *fakeStore) GetEnvironmentVariableByKey(_ context.Context, key string) (EnvironmentVariable, error) {
	for _, ev := range s.byID {
		if ev.Key == key {
			return ev, nil
		}
	}
	return EnvironmentVariable{}, errEnvironmentVariableNotFound
}

func (s *fakeStore) UpdateEnvironmentVariableByID(_ context.Context, id, description, value string) error {
	ev, ok := s.byID[id]
	if !ok {
		return errEnvironmentVariableNotFound
	}
	ev.Description = description
	ev.Value = value
	s.byID[id] = ev
	return nil
}

func (s *fakeStore) DeleteEnvironmentVariableByID(_ context.Context, id string) error {
	if _, ok := s.byID[id]; !ok {
		return errEnvironmentVariableNotFound
	}
	delete(s.byID, id)
	return nil
}

func (s *fakeStore) GetEnvironmentVariableValues(_ context.Context) (map[string]string, error) {
	out := map[string]string{}
	for _, id := range s.order {
		ev := s.byID[id]
		out[ev.Key] = ev.Value
	}
	return out, nil
}

// failingStore fails every persistence call with an error other than the not-found sentinel, so the
// service must surface the generic internal error.
type failingStore struct{}

func (s *failingStore) CreateEnvironmentVariable(_ context.Context, _ EnvironmentVariable) error {
	return errStoreFailure
}

func (s *failingStore) GetEnvironmentVariableCount(_ context.Context) (int, error) {
	return 0, errStoreFailure
}

func (s *failingStore) GetEnvironmentVariableList(_ context.Context, _,
	_ int) ([]EnvironmentVariable, error) {
	return nil, errStoreFailure
}

func (s *failingStore) GetEnvironmentVariableByID(_ context.Context, _ string) (EnvironmentVariable, error) {
	return EnvironmentVariable{}, errStoreFailure
}

func (s *failingStore) GetEnvironmentVariableByKey(_ context.Context, _ string) (EnvironmentVariable, error) {
	return EnvironmentVariable{}, errStoreFailure
}

func (s *failingStore) UpdateEnvironmentVariableByID(_ context.Context, _, _, _ string) error {
	return errStoreFailure
}

func (s *failingStore) DeleteEnvironmentVariableByID(_ context.Context, _ string) error {
	return errStoreFailure
}

func (s *failingStore) GetEnvironmentVariableValues(_ context.Context) (map[string]string, error) {
	return nil, errStoreFailure
}

var errStoreFailure = errors.New("store failure")

// missingID is an id that is never created, used to exercise the not-found paths.
const missingID = "missing"

func newTestService() (*fakeStore, EnvironmentVariableServiceInterface) {
	store := newFakeStore()
	return store, newEnvironmentVariableService(store)
}

func TestCreateEnvironmentVariable(t *testing.T) {
	tests := []struct {
		name        string
		existingKey string
		request     CreateEnvironmentVariableRequest
		expectedErr string
	}{
		{
			name:    "Success",
			request: CreateEnvironmentVariableRequest{Key: "MY_APP_REDIRECT_URL", Value: "https://app/cb"},
		},
		{
			name:        "KeyStartingWithDigit",
			request:     CreateEnvironmentVariableRequest{Key: "1_BAD", Value: "v"},
			expectedErr: ErrorInvalidEnvironmentVariableRequest.Code,
		},
		{
			name:        "KeyWithSpace",
			request:     CreateEnvironmentVariableRequest{Key: "BAD KEY", Value: "v"},
			expectedErr: ErrorInvalidEnvironmentVariableRequest.Code,
		},
		{
			name:        "EmptyKey",
			request:     CreateEnvironmentVariableRequest{Key: "", Value: "v"},
			expectedErr: ErrorInvalidEnvironmentVariableRequest.Code,
		},
		{
			name:        "DuplicateKey",
			existingKey: "DUP_KEY",
			request:     CreateEnvironmentVariableRequest{Key: "DUP_KEY", Value: "second"},
			expectedErr: ErrorEnvironmentVariableKeyConflict.Code,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			store, svc := newTestService()
			ctx := context.Background()

			if test.existingKey != "" {
				_, svcErr := svc.CreateEnvironmentVariable(ctx, CreateEnvironmentVariableRequest{
					Key: test.existingKey, Value: "first",
				})
				require.Nil(t, svcErr)
			}

			created, svcErr := svc.CreateEnvironmentVariable(ctx, test.request)

			if test.expectedErr != "" {
				require.NotNil(t, svcErr)
				assert.Equal(t, test.expectedErr, svcErr.Code)
				return
			}

			require.Nil(t, svcErr)
			require.NotNil(t, created)
			assert.NotEmpty(t, created.ID)
			assert.Equal(t, test.request.Key, created.Key)
			// Values are non-secret, so they are stored and returned in plaintext.
			assert.Equal(t, test.request.Value, created.Value)
			assert.Equal(t, test.request.Value, store.byID[created.ID].Value)
		})
	}
}

func TestGetEnvironmentVariable(t *testing.T) {
	tests := []struct {
		name        string
		create      bool
		expectedErr string
	}{
		{name: "Success", create: true},
		{name: "NotFound", expectedErr: ErrorEnvironmentVariableNotFound.Code},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, svc := newTestService()
			ctx := context.Background()

			id := missingID
			if test.create {
				created, svcErr := svc.CreateEnvironmentVariable(ctx, CreateEnvironmentVariableRequest{
					Key: "REDIRECT_URL", Value: "https://app/cb", Description: "callback",
				})
				require.Nil(t, svcErr)
				id = created.ID
			}

			got, svcErr := svc.GetEnvironmentVariable(ctx, id)

			if test.expectedErr != "" {
				require.NotNil(t, svcErr)
				assert.Equal(t, test.expectedErr, svcErr.Code)
				return
			}

			require.Nil(t, svcErr)
			assert.Equal(t, "REDIRECT_URL", got.Key)
			assert.Equal(t, "https://app/cb", got.Value)
			assert.Equal(t, "callback", got.Description)
		})
	}
}

func TestGetEnvironmentVariableList(t *testing.T) {
	tests := []struct {
		name          string
		keys          []string
		limit         int
		offset        int
		expectedTotal int
		expectedCount int
	}{
		{name: "Empty", limit: 10, expectedTotal: 0, expectedCount: 0},
		{name: "AllWithinLimit", keys: []string{"A", "B"}, limit: 10, expectedTotal: 2, expectedCount: 2},
		{name: "LimitTruncates", keys: []string{"A", "B", "C"}, limit: 2, expectedTotal: 3, expectedCount: 2},
		{name: "OffsetSkips", keys: []string{"A", "B", "C"}, limit: 10, offset: 2, expectedTotal: 3, expectedCount: 1},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, svc := newTestService()
			ctx := context.Background()

			for _, key := range test.keys {
				_, svcErr := svc.CreateEnvironmentVariable(ctx, CreateEnvironmentVariableRequest{
					Key: key, Value: "v" + key,
				})
				require.Nil(t, svcErr)
			}

			resp, svcErr := svc.GetEnvironmentVariableList(ctx, test.limit, test.offset)

			require.Nil(t, svcErr)
			assert.Equal(t, test.expectedTotal, resp.TotalResults)
			assert.Equal(t, test.expectedCount, resp.Count)
			assert.Len(t, resp.EnvironmentVariables, test.expectedCount)
		})
	}
}

func TestUpdateEnvironmentVariable(t *testing.T) {
	tests := []struct {
		name        string
		create      bool
		request     UpdateEnvironmentVariableRequest
		expectedErr string
	}{
		{
			name:    "Success",
			create:  true,
			request: UpdateEnvironmentVariableRequest{Value: "https://app/new", Description: "updated"},
		},
		{
			name:        "NotFound",
			request:     UpdateEnvironmentVariableRequest{Value: "x"},
			expectedErr: ErrorEnvironmentVariableNotFound.Code,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			store, svc := newTestService()
			ctx := context.Background()

			id := missingID
			if test.create {
				created, svcErr := svc.CreateEnvironmentVariable(ctx, CreateEnvironmentVariableRequest{
					Key: "REDIRECT_URL", Value: "https://app/old",
				})
				require.Nil(t, svcErr)
				id = created.ID
			}

			updated, svcErr := svc.UpdateEnvironmentVariable(ctx, id, test.request)

			if test.expectedErr != "" {
				require.NotNil(t, svcErr)
				assert.Equal(t, test.expectedErr, svcErr.Code)
				return
			}

			require.Nil(t, svcErr)
			assert.Equal(t, test.request.Value, updated.Value)
			assert.Equal(t, test.request.Description, updated.Description)
			assert.Equal(t, test.request.Value, store.byID[id].Value)
		})
	}
}

func TestDeleteEnvironmentVariable(t *testing.T) {
	tests := []struct {
		name        string
		create      bool
		expectedErr string
	}{
		{name: "Success", create: true},
		{name: "NotFound", expectedErr: ErrorEnvironmentVariableNotFound.Code},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, svc := newTestService()
			ctx := context.Background()

			id := missingID
			if test.create {
				created, svcErr := svc.CreateEnvironmentVariable(ctx, CreateEnvironmentVariableRequest{
					Key: "REDIRECT_URL", Value: "v",
				})
				require.Nil(t, svcErr)
				id = created.ID
			}

			svcErr := svc.DeleteEnvironmentVariable(ctx, id)

			if test.expectedErr != "" {
				require.NotNil(t, svcErr)
				assert.Equal(t, test.expectedErr, svcErr.Code)
				return
			}

			require.Nil(t, svcErr)
			_, svcErr = svc.GetEnvironmentVariable(ctx, id)
			require.NotNil(t, svcErr)
			assert.Equal(t, ErrorEnvironmentVariableNotFound.Code, svcErr.Code)
		})
	}
}

func TestResolveEnvironmentVariables(t *testing.T) {
	tests := []struct {
		name     string
		created  map[string]string
		expected map[string]string
	}{
		{name: "Empty", expected: map[string]string{}},
		{
			name:     "AllKeysAndValues",
			created:  map[string]string{"A": "alpha", "B": "beta"},
			expected: map[string]string{"A": "alpha", "B": "beta"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, svc := newTestService()
			ctx := context.Background()

			for key, value := range test.created {
				_, svcErr := svc.CreateEnvironmentVariable(ctx, CreateEnvironmentVariableRequest{
					Key: key, Value: value,
				})
				require.Nil(t, svcErr)
			}

			values, svcErr := svc.ResolveEnvironmentVariables(ctx)

			require.Nil(t, svcErr)
			assert.Equal(t, test.expected, values)
		})
	}
}

func TestServiceStoreFailuresReturnInternalError(t *testing.T) {
	tests := []struct {
		name string
		call func(ctx context.Context, svc EnvironmentVariableServiceInterface) *tidcommon.ServiceError
	}{
		{
			name: "Create",
			call: func(ctx context.Context, svc EnvironmentVariableServiceInterface) *tidcommon.ServiceError {
				_, svcErr := svc.CreateEnvironmentVariable(ctx, CreateEnvironmentVariableRequest{Key: "K", Value: "v"})
				return svcErr
			},
		},
		{
			name: "Get",
			call: func(ctx context.Context, svc EnvironmentVariableServiceInterface) *tidcommon.ServiceError {
				_, svcErr := svc.GetEnvironmentVariable(ctx, missingID)
				return svcErr
			},
		},
		{
			name: "List",
			call: func(ctx context.Context, svc EnvironmentVariableServiceInterface) *tidcommon.ServiceError {
				_, svcErr := svc.GetEnvironmentVariableList(ctx, 10, 0)
				return svcErr
			},
		},
		{
			name: "Update",
			call: func(ctx context.Context, svc EnvironmentVariableServiceInterface) *tidcommon.ServiceError {
				_, svcErr := svc.UpdateEnvironmentVariable(ctx, missingID, UpdateEnvironmentVariableRequest{Value: "v"})
				return svcErr
			},
		},
		{
			name: "Delete",
			call: func(ctx context.Context, svc EnvironmentVariableServiceInterface) *tidcommon.ServiceError {
				return svc.DeleteEnvironmentVariable(ctx, missingID)
			},
		},
		{
			name: "Resolve",
			call: func(ctx context.Context, svc EnvironmentVariableServiceInterface) *tidcommon.ServiceError {
				_, svcErr := svc.ResolveEnvironmentVariables(ctx)
				return svcErr
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			svc := newEnvironmentVariableService(&failingStore{})

			svcErr := test.call(context.Background(), svc)

			require.NotNil(t, svcErr)
			assert.Equal(t, ErrorInternalServer.Code, svcErr.Code)
		})
	}
}
