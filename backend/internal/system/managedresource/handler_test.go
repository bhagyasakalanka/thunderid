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
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package managedresource

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func listRecorder(t *testing.T) *httptest.ResponseRecorder {
	t.Helper()
	recorder := httptest.NewRecorder()
	handleList(recorder, httptest.NewRequest(http.MethodGet, "/managed-resources", nil))
	return recorder
}

func TestListReportsWhatTheControlPlaneOwns(t *testing.T) {
	store := newFakeStore()
	if err := store.Mark(context.Background(), TypeApplication, "app-1"); err != nil {
		t.Fatalf("failed to mark the resource: %v", err)
	}
	SetDefault(enabledRegistry(store))
	t.Cleanup(func() { SetDefault(nil) })

	recorder := listRecorder(t)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}

	var response listResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode the response: %v", err)
	}
	if !response.Enabled {
		t.Fatal("expected ownership to be reported as tracked")
	}
	if len(response.Managed[TypeApplication]) != 1 || response.Managed[TypeApplication][0] != "app-1" {
		t.Fatalf("expected the owned application to be listed, got %v", response.Managed[TypeApplication])
	}
	if len(response.Managed[TypeRole]) != 0 {
		t.Fatalf("expected no owned roles, got %v", response.Managed[TypeRole])
	}
}

func TestListFailsWhenTheRegistryCannotBeRead(t *testing.T) {
	store := newFakeStore()
	store.err = errors.New("database is down")
	SetDefault(enabledRegistry(store))
	t.Cleanup(func() { SetDefault(nil) })

	// An empty listing reads as "nothing is owned", which offers edit controls the write path then
	// refuses. An unreadable registry has to say so instead.
	if recorder := listRecorder(t); recorder.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 when the registry cannot be read, got %d", recorder.Code)
	}
}

func TestListReportsNothingTrackedWhenOwnershipIsNotRecorded(t *testing.T) {
	SetDefault(New(false, ""))
	t.Cleanup(func() { SetDefault(nil) })

	recorder := listRecorder(t)
	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}

	var response listResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode the response: %v", err)
	}
	if response.Enabled {
		t.Fatal("expected ownership to be reported as not tracked")
	}
	if len(response.Managed) != 0 {
		t.Fatalf("expected no owned resources, got %v", response.Managed)
	}
}
