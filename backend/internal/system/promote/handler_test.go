// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package promote

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	tidcommon "github.com/thunder-id/thunderid/pkg/thunderidengine/common"
)

// stubService lets a test choose what the handler is given back.
type stubService struct {
	response *Response
	err      *tidcommon.ServiceError
	request  *Request
}

func (s *stubService) Promote(_ context.Context, request *Request) (*Response, *tidcommon.ServiceError) {
	s.request = request
	return s.response, s.err
}

func post(h *handler, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(http.MethodPost, basePath, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	h.HandlePromoteRequest(recorder, request)
	return recorder
}

func TestHandlerReturnsThePromotionResult(t *testing.T) {
	service := &stubService{response: &Response{From: "dev", To: "stage", Resources: 3}}
	recorder := post(newHandler(service), `{"from":"dev","to":"stage"}`)

	require.Equal(t, http.StatusOK, recorder.Code)

	var body Response
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &body))
	assert.Equal(t, "dev", body.From)
	assert.Equal(t, "stage", body.To)
	assert.Equal(t, 3, body.Resources)
}

func TestHandlerPassesTheRequestThrough(t *testing.T) {
	service := &stubService{response: &Response{}}
	post(newHandler(service), `{"from":"dev","to":"prod","dryRun":true}`)

	require.NotNil(t, service.request)
	assert.Equal(t, "dev", service.request.From)
	assert.Equal(t, "prod", service.request.To)
	assert.True(t, service.request.DryRun)
}

func TestHandlerRejectsAMalformedBody(t *testing.T) {
	recorder := post(newHandler(&stubService{response: &Response{}}), `{"from":`)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	assert.Contains(t, recorder.Body.String(), ErrorInvalidRequest.Code)
}

// A client error is the caller's to fix, so it is reported as one rather than as a server fault.
func TestHandlerReportsAClientErrorAsBadRequest(t *testing.T) {
	service := &stubService{err: &tidcommon.ServiceError{
		Type: tidcommon.ClientErrorType, Code: ErrorSourceEmpty.Code,
		Error: ErrorSourceEmpty.Error, ErrorDescription: ErrorSourceEmpty.ErrorDescription,
	}}
	recorder := post(newHandler(service), `{"from":"empty","to":"stage"}`)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	assert.Contains(t, recorder.Body.String(), ErrorSourceEmpty.Code)
}

func TestHandlerReportsAServerErrorAsInternal(t *testing.T) {
	service := &stubService{err: &tidcommon.ServiceError{
		Type: tidcommon.ServerErrorType, Code: "PRM-5000",
		Error: tidcommon.I18nMessage{DefaultValue: "Something failed"},
	}}
	recorder := post(newHandler(service), `{"from":"dev","to":"stage"}`)

	assert.Equal(t, http.StatusInternalServerError, recorder.Code)
}

// The route is registered where the API says it is, and OPTIONS is answered for the browser.
func TestRoutesAreRegistered(t *testing.T) {
	mux := http.NewServeMux()
	registerRoutes(mux, newHandler(&stubService{response: &Response{}}))

	for _, method := range []string{http.MethodPost, http.MethodOptions} {
		request := httptest.NewRequest(method, basePath, strings.NewReader(`{"from":"a","to":"b"}`))
		_, pattern := mux.Handler(request)
		assert.NotEmpty(t, pattern, "%s %s should be routed", method, basePath)
	}
}
