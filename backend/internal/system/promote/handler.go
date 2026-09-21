// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package promote

import (
	"context"
	"net/http"

	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"

	"github.com/thunder-id/thunderid/internal/system/error/apierror"
	"github.com/thunder-id/thunderid/internal/system/log"
	sysutils "github.com/thunder-id/thunderid/internal/system/utils"
)

// handler serves the promotion API.
type handler struct {
	service ServiceInterface
}

func newHandler(service ServiceInterface) *handler {
	return &handler{service: service}
}

// HandlePromoteRequest promotes one deployment's configuration into another.
func (h *handler) HandlePromoteRequest(w http.ResponseWriter, r *http.Request) {
	logger := log.GetLogger().With(log.String(log.LoggerKeyComponentName, "PromoteHandler"))

	request, err := sysutils.DecodeJSONBody[Request](r)
	if err != nil {
		sysutils.WriteErrorResponse(r.Context(), w, http.StatusBadRequest, apierror.ErrorResponse{
			Code:        ErrorInvalidRequest.Code,
			Message:     ErrorInvalidRequest.Error,
			Description: ErrorInvalidRequest.ErrorDescription,
		})
		return
	}

	response, svcErr := h.service.Promote(r.Context(), request)
	if svcErr != nil {
		if svcErr.Type == tidcommon.ServerErrorType {
			logger.Error(r.Context(), "Error promoting configuration", log.Any("serviceError", svcErr))
		}
		h.handleError(r.Context(), w, svcErr)
		return
	}

	sysutils.WriteSuccessResponse(r.Context(), w, http.StatusOK, response)
}

// handleError maps a service error onto its status code.
func (h *handler) handleError(ctx context.Context, w http.ResponseWriter, svcErr *tidcommon.ServiceError) {
	status := http.StatusInternalServerError
	if svcErr.Type == tidcommon.ClientErrorType {
		status = http.StatusBadRequest
	}
	sysutils.WriteErrorResponse(ctx, w, status, apierror.ErrorResponse{
		Code:        svcErr.Code,
		Message:     svcErr.Error,
		Description: svcErr.ErrorDescription,
	})
}
