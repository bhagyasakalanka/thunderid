// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package promote

import (
	"net/http"

	"github.com/thunder-id/thunderid/internal/system/export"
	"github.com/thunder-id/thunderid/internal/system/importer"
	"github.com/thunder-id/thunderid/internal/system/middleware"
)

// basePath is where a promotion is requested.
const basePath = "/promote"

// Initialize builds the promotion service and registers its route.
//
// It is given the export and import services rather than building its own, because a promotion is
// those two operations pointed at different deployments. Sharing them means a resource type added
// to either is carried by a promotion without this package being touched.
func Initialize(mux *http.ServeMux, exporter export.ExportServiceInterface,
	imp importer.ImportServiceInterface) ServiceInterface {
	svc := newService(exporter, imp)
	registerRoutes(mux, newHandler(svc))
	return svc
}

// registerRoutes mounts the promotion route.
func registerRoutes(mux *http.ServeMux, h *handler) {
	opts := middleware.CORSOptions{
		AllowedMethods:   []string{"POST"},
		AllowedHeaders:   middleware.DefaultAllowedHeaders,
		AllowCredentials: true,
		MaxAge:           600,
	}
	mux.HandleFunc(middleware.WithCORS("POST "+basePath, h.HandlePromoteRequest, opts))
	mux.HandleFunc(middleware.WithCORS("OPTIONS "+basePath, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}, opts))
}
