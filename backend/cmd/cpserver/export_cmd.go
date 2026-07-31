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

package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"github.com/thunder-id/thunderid/internal/system/cache"
	"github.com/thunder-id/thunderid/internal/system/deployment"
	"github.com/thunder-id/thunderid/internal/system/export"
	"github.com/thunder-id/thunderid/internal/system/log"
)

// exportSubcommand is the first positional argument that selects the in-process export one-shot
// instead of starting the long-running server.
const exportSubcommand = "export"

// isExportInvocation reports whether the process was started as the export one-shot
// (e.g. `cpserver export --deployment-id <tenant> --out <dir>`).
func isExportInvocation() bool {
	return flag.Arg(0) == exportSubcommand
}

// runExport parses the export subcommand options, runs the export in-process for the requested
// deployment (tenant), writes the declarative bundle to the output directory, and tears down. On a
// token-mode multi-tenant Control Plane, --deployment-id selects whose configuration is exported;
// the export reads through the same tenant-scoped stores, so the bundle contains exactly that
// tenant's resources. Empty --deployment-id exports the server-configured deployment.
func runExport(ctx context.Context, logger *log.Logger, exportSvc export.ExportServiceInterface,
	cacheManager cache.CacheManagerInterface) error {
	fs := flag.NewFlagSet(exportSubcommand, flag.ContinueOnError)
	deploymentID := fs.String("deployment-id", "", "Deployment id (tenant) whose configuration to export")
	outDir := fs.String("out", "", "Directory to write the exported declarative bundle to")
	_ = fs.Parse(flag.Args()[1:])

	if *outDir == "" {
		shutdownBootstrap(ctx, logger, cacheManager)
		return fmt.Errorf("no output directory supplied: set --out <dir>")
	}

	// Scope the export to the requested tenant so the stores resolve its deployment id.
	if *deploymentID != "" {
		ctx = deployment.WithID(ctx, *deploymentID)
	}

	includeDeps := true
	request := &export.ExportRequest{
		Applications:      []string{"*"},
		Connections:       []string{"*"},
		UserTypes:         []string{"*"},
		OrganizationUnits: []string{"*"},
		Users:             []string{"*"},
		Groups:            []string{"*"},
		ResourceServers:   []string{"*"},
		Roles:             []string{"*"},
		Flows:             []string{"*"},
		Translations:      []string{"*"},
		Layouts:           []string{"*"},
		Themes:            []string{"*"},
		ServerConfigs:     []string{"*"},
		Options: &export.ExportOptions{
			IncludeDependencies: includeDeps,
			Format:              "yaml",
		},
	}

	response, svcErr := exportSvc.ExportResources(ctx, request)
	if svcErr != nil {
		shutdownBootstrap(ctx, logger, cacheManager)
		return fmt.Errorf("export failed [%s]: %s", svcErr.Code, svcErr.Error.DefaultValue)
	}

	if err := writeExportBundle(*outDir, response); err != nil {
		shutdownBootstrap(ctx, logger, cacheManager)
		return err
	}

	logger.Info(ctx, "In-process export completed",
		log.String("deploymentId", *deploymentID),
		log.String("out", *outDir),
		log.Int("files", len(response.Files)))
	shutdownBootstrap(ctx, logger, cacheManager)
	return nil
}

// writeExportBundle writes every exported file (and the env sidecar, if present) under outDir,
// preserving each file's relative folder path.
func writeExportBundle(outDir string, response *export.ExportResponse) error {
	if err := os.MkdirAll(outDir, 0o750); err != nil {
		return fmt.Errorf("failed to create output directory %q: %w", outDir, err)
	}
	for _, f := range response.Files {
		dir := filepath.Join(outDir, filepath.Clean(f.FolderPath))
		if err := os.MkdirAll(dir, 0o750); err != nil {
			return fmt.Errorf("failed to create %q: %w", dir, err)
		}
		path := filepath.Join(dir, f.FileName)
		if err := os.WriteFile(path, []byte(f.Content), 0o600); err != nil {
			return fmt.Errorf("failed to write %q: %w", path, err)
		}
	}
	if response.EnvFile != nil {
		path := filepath.Join(outDir, response.EnvFile.FileName)
		if err := os.WriteFile(path, []byte(response.EnvFile.Content), 0o600); err != nil {
			return fmt.Errorf("failed to write env file %q: %w", path, err)
		}
	}
	return nil
}
