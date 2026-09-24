// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"reflect"
	"strings"
	"testing"

	"github.com/thunder-id/thunderid/internal/system/config"
	"github.com/thunder-id/thunderid/internal/system/constants"
	"github.com/thunder-id/thunderid/internal/system/log"
)

// storeFields reports every Store field in the configuration by path, found by walking the struct
// rather than by a list kept alongside the one in forceMutableStores.
//
// A list would agree with itself: a resource type added to the configuration and forgotten in both
// places would leave a store this plane never overrides, and that is exactly the hole these tests
// exist to close. Walking the type is what makes a new field show up here on its own.
func storeFields(v reflect.Value, prefix string, out map[string]string) {
	t := v.Type()
	for i := range t.NumField() {
		field := t.Field(i)
		value := v.Field(i)
		path := field.Name
		if prefix != "" {
			path = prefix + "." + field.Name
		}
		switch {
		case field.Name == "Store" && value.Kind() == reflect.String:
			out[prefix] = value.String()
		case value.Kind() == reflect.Struct:
			storeFields(value, path, out)
		}
	}
}

// Every store the configuration carries is mutable afterwards, whatever it asked for. A resource
// type added later and not overridden fails here rather than quietly running declarative.
func TestForceMutableStoresLeavesNoStoreBehind(t *testing.T) {
	cfg := &config.Config{}

	// Ask for a declarative store everywhere, which is what this plane must refuse.
	asked := map[string]string{}
	storeFields(reflect.ValueOf(cfg).Elem(), "", asked)
	if len(asked) == 0 {
		t.Fatal("found no Store fields in the configuration; the walk is not finding them")
	}
	setAllStores(t, cfg, string(constants.StoreModeDeclarative))
	cfg.DeclarativeResources.Enabled = true

	forceMutableStores(context.Background(), log.GetLogger(), cfg)

	if cfg.DeclarativeResources.Enabled {
		t.Error("declarative_resources.enabled survived")
	}
	got := map[string]string{}
	storeFields(reflect.ValueOf(cfg).Elem(), "", got)
	for path, mode := range got {
		if !strings.EqualFold(mode, string(constants.StoreModeMutable)) {
			t.Errorf("%s is %q, want %q: this store was not overridden",
				path, mode, constants.StoreModeMutable)
		}
	}
	if len(got) != len(asked) {
		t.Errorf("walked %d stores before and %d after", len(asked), len(got))
	}
}

// A configuration that asked for nothing still ends up explicitly mutable, so no service falls
// through to the global switch to decide for itself.
func TestForceMutableStoresFillsAnUnsetStore(t *testing.T) {
	cfg := &config.Config{}

	forceMutableStores(context.Background(), log.GetLogger(), cfg)

	got := map[string]string{}
	storeFields(reflect.ValueOf(cfg).Elem(), "", got)
	for path, mode := range got {
		if mode != string(constants.StoreModeMutable) {
			t.Errorf("%s is %q, want it set explicitly to %q", path, mode, constants.StoreModeMutable)
		}
	}
}

// setAllStores writes mode into every Store field the configuration carries.
func setAllStores(t *testing.T, cfg *config.Config, mode string) {
	t.Helper()

	var walk func(v reflect.Value)
	walk = func(v reflect.Value) {
		t := v.Type()
		for i := range t.NumField() {
			field := t.Field(i)
			value := v.Field(i)
			switch {
			case field.Name == "Store" && value.Kind() == reflect.String && value.CanSet():
				value.SetString(mode)
			case value.Kind() == reflect.Struct:
				walk(value)
			}
		}
	}
	walk(reflect.ValueOf(cfg).Elem())
}
