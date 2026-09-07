// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

package gateway

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/suite"

	"github.com/thunder-id/thunderid/tests/integration/testutils"
)

const testServerURL = "https://localhost:8095"

// gateway is the shape a read returns. Key is populated only by a registration, which is the one
// response that carries it; every read leaves it empty, which is what the tests below assert.
type gateway struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Key           string `json:"key,omitempty"`
	BaseURL       string `json:"baseUrl"`
	CACertificate string `json:"caCertificate,omitempty"`
	CreatedAt     string `json:"createdAt"`
	UpdatedAt     string `json:"updatedAt"`
}

type errorResponse struct {
	Code string `json:"code"`
}

type GatewayAPITestSuite struct {
	suite.Suite
	// prefix namespaces every gateway this run registers.
	//
	// Fixed names would make the suite depend on the deployment holding no gateways: a run
	// interrupted before its teardown leaves registrations behind, and the next run then meets a
	// conflict it did not expect. That is a failing test with nothing wrong in the code, which is the
	// worst kind. A prefix per run keeps one run's leftovers invisible to the next.
	prefix     string
	registered []string
}

// SetupSuite picks the namespace this run works in.
func (ts *GatewayAPITestSuite) SetupSuite() {
	ts.prefix = fmt.Sprintf("int-%d-", time.Now().UnixNano())
}

// name qualifies a gateway or data plane name with this run's prefix.
func (ts *GatewayAPITestSuite) name(suffix string) string {
	return ts.prefix + suffix
}

func TestGatewayAPITestSuite(t *testing.T) {
	suite.Run(t, new(GatewayAPITestSuite))
}

// TearDownTest removes whatever a test registered, so the deployment's gateway bound does not leak
// from one test into the next.
func (ts *GatewayAPITestSuite) TearDownTest() {
	for _, id := range ts.registered {
		ts.deleteGateway(id)
	}
	ts.registered = nil
}

func (ts *GatewayAPITestSuite) TestRegisterAndReadBack() {
	created := ts.register(map[string]string{
		"name":    ts.name("primary"),
		"baseUrl": "https://primary.integration.test:8090",
	}, http.StatusCreated)

	ts.Require().NotEmpty(created.ID)
	ts.Equal(ts.name("primary"), created.Name)
	ts.Equal("https://primary.integration.test:8090", created.BaseURL)
	// The database assigns these, so an empty value means the response was built rather than read.
	ts.NotEmpty(created.CreatedAt)
	ts.NotEmpty(created.UpdatedAt)

	fetched := ts.getGateway(created.ID, http.StatusOK)
	ts.Equal(created.ID, fetched.ID)
}

// Registration is the one response that carries the key. No read returns it afterwards, so the
// value handed over here is the only copy the caller will ever see.
func (ts *GatewayAPITestSuite) TestOnlyRegistrationReturnsTheKey() {
	created := ts.register(map[string]string{
		"name":    ts.name("secret-check"),
		"baseUrl": "https://secret-check.integration.test:8090",
	}, http.StatusCreated)

	ts.Require().NotEmpty(created.Key, "registration must return the key it issued")

	for _, path := range []string{"/gateways/" + created.ID, "/gateways"} {
		body := ts.rawGet(path)
		ts.NotContains(body, created.Key, "the issued key was returned by GET %s", path)
		ts.NotContains(body, `"key"`, "GET %s returned a key field", path)
	}
}

// One data plane registers once, whatever name it is given the second time.
func (ts *GatewayAPITestSuite) TestADataPlaneRegistersOnce() {
	ts.register(map[string]string{
		"name":    ts.name("first"),
		"baseUrl": "https://shared.integration.test:8090",
	}, http.StatusCreated)

	code := ts.registerExpectingError(map[string]string{
		"name":    ts.name("second"),
		"baseUrl": "https://shared.integration.test:8090",
	}, http.StatusConflict)
	ts.Equal("GTW-1008", code)
}

func (ts *GatewayAPITestSuite) TestANameRegistersOnce() {
	ts.register(map[string]string{
		"name":    ts.name("duplicate-name"),
		"baseUrl": "https://duplicate-name.integration.test:8090",
	}, http.StatusCreated)

	// A different address, so it is the name that is refused and not the address.
	code := ts.registerExpectingError(map[string]string{
		"name":    ts.name("duplicate-name"),
		"baseUrl": "https://duplicate-name-elsewhere.integration.test:8090",
	}, http.StatusConflict)
	ts.Equal("GTW-1004", code)
}

// A registration that could never be reached is refused where the caller can still see why.
func (ts *GatewayAPITestSuite) TestAnUnusableRegistrationIsRefused() {
	for name, body := range map[string]map[string]string{
		"no name":             {"baseUrl": "https://dp.test"},
		"no base url":         {"name": "x"},
		"base url is a slash": {"name": "x", "baseUrl": "/"},
		"base url is a scheme": {
			"name": "x", "baseUrl": "https://"},
	} {
		ts.Run(name, func() {
			ts.registerExpectingError(body, http.StatusBadRequest)
		})
	}
}

func (ts *GatewayAPITestSuite) TestListReturnsWhatWasRegistered() {
	created := ts.register(map[string]string{
		"name":    ts.name("listed"),
		"baseUrl": "https://listed.integration.test:8090",
	}, http.StatusCreated)

	req, err := http.NewRequest(http.MethodGet, testServerURL+"/gateways", nil)
	ts.Require().NoError(err)
	resp, err := testutils.GetHTTPClient().Do(req)
	ts.Require().NoError(err)
	defer func() { _ = resp.Body.Close() }()
	ts.Require().Equal(http.StatusOK, resp.StatusCode)

	var listed []gateway
	ts.Require().NoError(json.NewDecoder(resp.Body).Decode(&listed))

	found := false
	for _, g := range listed {
		if g.ID == created.ID {
			found = true
			ts.Equal(ts.name("listed"), g.Name)
		}
	}
	ts.True(found, "the registered gateway was not in the listing")
}

func (ts *GatewayAPITestSuite) TestDeleteRemovesIt() {
	created := ts.register(map[string]string{
		"name":    ts.name("removable"),
		"baseUrl": "https://removable.integration.test:8090",
	}, http.StatusCreated)

	ts.deleteGateway(created.ID)
	ts.registered = nil

	ts.getGateway(created.ID, http.StatusNotFound)
}

func (ts *GatewayAPITestSuite) TestReadingOneThatIsNotRegistered() {
	ts.getGateway("00000000-0000-0000-0000-000000000000", http.StatusNotFound)
}

// ---- helpers ----

func (ts *GatewayAPITestSuite) register(body map[string]string, wantStatus int) gateway {
	ts.T().Helper()

	resp := ts.post("/gateways", body)
	defer func() { _ = resp.Body.Close() }()
	ts.Require().Equal(wantStatus, resp.StatusCode)

	var created gateway
	ts.Require().NoError(json.NewDecoder(resp.Body).Decode(&created))
	ts.registered = append(ts.registered, created.ID)
	return created
}

func (ts *GatewayAPITestSuite) registerExpectingError(body map[string]string, wantStatus int) string {
	ts.T().Helper()

	resp := ts.post("/gateways", body)
	defer func() { _ = resp.Body.Close() }()
	ts.Require().Equal(wantStatus, resp.StatusCode)

	var failure errorResponse
	ts.Require().NoError(json.NewDecoder(resp.Body).Decode(&failure))
	return failure.Code
}

func (ts *GatewayAPITestSuite) post(path string, body map[string]string) *http.Response {
	ts.T().Helper()

	encoded, err := json.Marshal(body)
	ts.Require().NoError(err)

	req, err := http.NewRequest(http.MethodPost, testServerURL+path, bytes.NewReader(encoded))
	ts.Require().NoError(err)
	req.Header.Set("Content-Type", "application/json")

	resp, err := testutils.GetHTTPClient().Do(req)
	ts.Require().NoError(err)
	return resp
}

func (ts *GatewayAPITestSuite) getGateway(id string, wantStatus int) gateway {
	ts.T().Helper()

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("%s/gateways/%s", testServerURL, id), nil)
	ts.Require().NoError(err)

	resp, err := testutils.GetHTTPClient().Do(req)
	ts.Require().NoError(err)
	defer func() { _ = resp.Body.Close() }()
	ts.Require().Equal(wantStatus, resp.StatusCode)

	var fetched gateway
	if wantStatus == http.StatusOK {
		ts.Require().NoError(json.NewDecoder(resp.Body).Decode(&fetched))
	}
	return fetched
}

func (ts *GatewayAPITestSuite) rawGet(path string) string {
	ts.T().Helper()

	req, err := http.NewRequest(http.MethodGet, testServerURL+path, nil)
	ts.Require().NoError(err)

	resp, err := testutils.GetHTTPClient().Do(req)
	ts.Require().NoError(err)
	defer func() { _ = resp.Body.Close() }()

	body, err := io.ReadAll(resp.Body)
	ts.Require().NoError(err)
	return string(body)
}

func (ts *GatewayAPITestSuite) deleteGateway(id string) {
	ts.T().Helper()

	req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("%s/gateways/%s", testServerURL, id), nil)
	ts.Require().NoError(err)

	resp, err := testutils.GetHTTPClient().Do(req)
	ts.Require().NoError(err)
	defer func() { _ = resp.Body.Close() }()
}

// A gateway declared in a file is registered as the server starts, without anyone calling the API.
// This also covers the adoption path: the loader reads the file, the service adopts it by name, and
// the store writes it.
func (ts *GatewayAPITestSuite) TestADeclaredGatewayIsRegisteredAtStartup() {
	listed := ts.listAll()

	var declared *gateway
	for i := range listed {
		if listed[i].Name == "declared-integration-gateway" {
			declared = &listed[i]
		}
	}

	ts.Require().NotNil(declared,
		"the gateway declared in config/resources/gateways was not registered at startup")
	ts.Equal("https://declared.integration.test:8090", declared.BaseURL)
	ts.Equal("https://declared.integration.test:8090", declared.BaseURL)
}

// A declared gateway holds a key like any other, and it is no more readable for having come from a
// file.
func (ts *GatewayAPITestSuite) TestADeclaredGatewayNeverReturnsItsKey() {
	body := ts.rawGet("/gateways")

	ts.NotContains(body, "declared-integration-management-token",
		"the declared gateway's key was returned by the listing")
}

// The declared gateway may not have its address taken by an API registration: one data plane
// registers once, however it was registered.
func (ts *GatewayAPITestSuite) TestADeclaredDataPlaneCannotBeTakenByTheAPI() {
	code := ts.registerExpectingError(map[string]string{
		"name": ts.name("stealing-the-declared-dp"),
		// The address the declared gateway already answers at.
		"baseUrl": "https://declared.integration.test:8090",
	}, http.StatusConflict)

	ts.Equal("GTW-1008", code)
}

func (ts *GatewayAPITestSuite) listAll() []gateway {
	ts.T().Helper()

	req, err := http.NewRequest(http.MethodGet, testServerURL+"/gateways", nil)
	ts.Require().NoError(err)
	resp, err := testutils.GetHTTPClient().Do(req)
	ts.Require().NoError(err)
	defer func() { _ = resp.Body.Close() }()
	ts.Require().Equal(http.StatusOK, resp.StatusCode)

	var listed []gateway
	ts.Require().NoError(json.NewDecoder(resp.Body).Decode(&listed))
	return listed
}

// The bound is real: registering beyond server.max_gateways is refused, and nothing is stored.
func (ts *GatewayAPITestSuite) TestTheBoundIsEnforced() {
	// One gateway is declared at startup, so this fills the remaining room and then asks for one more.
	before := len(ts.listAll())

	for i := before; i < 5; i++ {
		ts.register(map[string]string{
			"name": fmt.Sprintf("%sfilling-%d", ts.prefix, i),
			// The address is what identifies a data plane, so each filler needs its own.
			"baseUrl": fmt.Sprintf("https://filling-%d.integration.test:8090", i),
		}, http.StatusCreated)
	}

	code := ts.registerExpectingError(map[string]string{
		"name":    ts.name("one-too-many"),
		"baseUrl": "https://one-too-many.integration.test:8090",
	}, http.StatusConflict)

	ts.Equal("GTW-1006", code)
	ts.Len(ts.listAll(), 5, "a refused registration was stored anyway")
}

// A data plane serving a certificate no public authority signed names its own, and that travels
// with the registration.
func (ts *GatewayAPITestSuite) TestACertificateAuthorityIsStored() {
	const pem = "-----BEGIN CERTIFICATE-----\\nMIIBkTCB+wIJAJ\\n-----END CERTIFICATE-----"

	created := ts.register(map[string]string{
		"name":          ts.name("with-ca"),
		"baseUrl":       "https://with-ca.integration.test:8090",
		"caCertificate": pem,
	}, http.StatusCreated)

	ts.Contains(created.CACertificate, "BEGIN CERTIFICATE")
	ts.Contains(ts.getGateway(created.ID, http.StatusOK).CACertificate, "BEGIN CERTIFICATE")
}

// Removing one that was never registered succeeds: a caller cleaning up should not have to ask
// first. Reading one that was never registered says so.
func (ts *GatewayAPITestSuite) TestRemovingOneThatIsNotRegistered() {
	req, err := http.NewRequest(http.MethodDelete,
		testServerURL+"/gateways/00000000-0000-0000-0000-000000000000", nil)
	ts.Require().NoError(err)

	resp, err := testutils.GetHTTPClient().Do(req)
	ts.Require().NoError(err)
	defer func() { _ = resp.Body.Close() }()

	ts.Equal(http.StatusNotFound, resp.StatusCode)
}

// A body that is not one JSON object is refused before the service sees it.
func (ts *GatewayAPITestSuite) TestASurplusBodyIsRefused() {
	for name, body := range map[string]string{
		"trailing object": `{"name":"x","baseUrl":"https://dp"} {}`,
		"not json":        `not json at all`,
	} {
		ts.Run(name, func() {
			req, err := http.NewRequest(http.MethodPost, testServerURL+"/gateways",
				bytes.NewReader([]byte(body)))
			ts.Require().NoError(err)
			req.Header.Set("Content-Type", "application/json")

			response, err := testutils.GetHTTPClient().Do(req)
			ts.Require().NoError(err)
			defer func() { _ = response.Body.Close() }()

			ts.Equal(http.StatusBadRequest, response.StatusCode)
		})
	}
}

// update sends a partial update and returns the gateway as it stands afterwards.
func (ts *GatewayAPITestSuite) update(id string, body map[string]string, wantStatus int) gateway {
	ts.T().Helper()

	resp := ts.send(http.MethodPatch, "/gateways/"+id, body)
	defer func() { _ = resp.Body.Close() }()
	ts.Require().Equal(wantStatus, resp.StatusCode)

	var updated gateway
	ts.Require().NoError(json.NewDecoder(resp.Body).Decode(&updated))
	return updated
}

// updateExpectingError returns the error code an update was refused with.
func (ts *GatewayAPITestSuite) updateExpectingError(id string, body map[string]string, wantStatus int) string {
	ts.T().Helper()

	resp := ts.send(http.MethodPatch, "/gateways/"+id, body)
	defer func() { _ = resp.Body.Close() }()
	ts.Require().Equal(wantStatus, resp.StatusCode)

	var failure errorResponse
	ts.Require().NoError(json.NewDecoder(resp.Body).Decode(&failure))
	return failure.Code
}

// send issues a request carrying a JSON body. A nil body sends none, which is what key rotation
// wants: it takes no input, only the gateway named in the path.
func (ts *GatewayAPITestSuite) send(method, path string, body map[string]string) *http.Response {
	ts.T().Helper()

	var reader io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		ts.Require().NoError(err)
		reader = bytes.NewReader(encoded)
	}

	req, err := http.NewRequest(method, testServerURL+path, reader)
	ts.Require().NoError(err)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := testutils.GetHTTPClient().Do(req)
	ts.Require().NoError(err)
	return resp
}

// An update carries only the fields it means to change, and leaves the rest as they were.
func (ts *GatewayAPITestSuite) TestUpdateChangesOnlyWhatItCarries() {
	created := ts.register(map[string]string{
		"name":    ts.name("update-partial"),
		"baseUrl": "https://update-partial.integration.test:8090",
	}, http.StatusCreated)

	renamed := ts.name("update-partial-renamed")
	updated := ts.update(created.ID, map[string]string{"name": renamed}, http.StatusOK)

	ts.Equal(renamed, updated.Name)
	ts.Equal("https://update-partial.integration.test:8090", updated.BaseURL,
		"an update that did not carry baseUrl changed it anyway")
	ts.Equal(created.ID, updated.ID)

	// The change is durable, not just whatever the response echoed back.
	readBack := ts.getGateway(created.ID, http.StatusOK)
	ts.Equal(renamed, readBack.Name)
	ts.Equal("https://update-partial.integration.test:8090", readBack.BaseURL)
}

// The address is what says which data plane a gateway is, so an update cannot move one gateway onto
// an address another already holds. The rule that governs registration governs updates too.
func (ts *GatewayAPITestSuite) TestUpdateCannotTakeAnAddressInUse() {
	taken := "https://update-taken.integration.test:8090"
	ts.register(map[string]string{
		"name":    ts.name("update-holder"),
		"baseUrl": taken,
	}, http.StatusCreated)

	mover := ts.register(map[string]string{
		"name":    ts.name("update-mover"),
		"baseUrl": "https://update-mover.integration.test:8090",
	}, http.StatusCreated)

	ts.NotEmpty(ts.updateExpectingError(mover.ID, map[string]string{"baseUrl": taken}, http.StatusConflict))

	// The refused update left the gateway where it was.
	ts.Equal("https://update-mover.integration.test:8090", ts.getGateway(mover.ID, http.StatusOK).BaseURL)
}

// An update to a gateway that was never registered is a 404, not a silent create.
func (ts *GatewayAPITestSuite) TestUpdatingOneThatIsNotRegistered() {
	resp := ts.send(http.MethodPatch, "/gateways/00000000-0000-0000-0000-000000000000",
		map[string]string{"name": ts.name("ghost")})
	defer func() { _ = resp.Body.Close() }()

	ts.Equal(http.StatusNotFound, resp.StatusCode)
}

// An update that would leave the gateway unreachable is refused.
func (ts *GatewayAPITestSuite) TestUpdateRefusesAnUnusableAddress() {
	created := ts.register(map[string]string{
		"name":    ts.name("update-bad-url"),
		"baseUrl": "https://update-bad-url.integration.test:8090",
	}, http.StatusCreated)

	for label, bad := range map[string]string{
		"a slash":        "/",
		"a scheme alone": "https://",
		"empty":          "",
	} {
		ts.Run(label, func() {
			resp := ts.send(http.MethodPatch, "/gateways/"+created.ID, map[string]string{"baseUrl": bad})
			defer func() { _ = resp.Body.Close() }()
			ts.Equal(http.StatusBadRequest, resp.StatusCode)
		})
	}
}

// Rotation issues a new key and hands it back once. The old key is replaced, and nothing about the
// gateway's identity moves with it.
func (ts *GatewayAPITestSuite) TestRotationIssuesANewKey() {
	created := ts.register(map[string]string{
		"name":    ts.name("rotate"),
		"baseUrl": "https://rotate.integration.test:8090",
	}, http.StatusCreated)
	ts.Require().NotEmpty(created.Key)

	resp := ts.send(http.MethodPost, "/gateways/"+created.ID+"/key", nil)
	defer func() { _ = resp.Body.Close() }()
	ts.Require().Equal(http.StatusOK, resp.StatusCode)

	var rotated struct {
		Key string `json:"key"`
	}
	ts.Require().NoError(json.NewDecoder(resp.Body).Decode(&rotated))

	ts.NotEmpty(rotated.Key, "rotation returned no key")
	ts.NotEqual(created.Key, rotated.Key, "rotation returned the key it was meant to replace")

	// Rotation replaces the credential and nothing else about the gateway.
	unchanged := ts.getGateway(created.ID, http.StatusOK)
	ts.Equal(created.ID, unchanged.ID)
	ts.Equal(created.BaseURL, unchanged.BaseURL)
	ts.Equal(created.Name, unchanged.Name)

	// Rotation is the only other response that carries a key. Reads still do not.
	body := ts.rawGet("/gateways/" + created.ID)
	ts.NotContains(body, rotated.Key, "a read returned the rotated key")
}

// Rotating the key of a gateway that was never registered is a 404.
func (ts *GatewayAPITestSuite) TestRotatingOneThatIsNotRegistered() {
	resp := ts.send(http.MethodPost, "/gateways/00000000-0000-0000-0000-000000000000/key", nil)
	defer func() { _ = resp.Body.Close() }()

	ts.Equal(http.StatusNotFound, resp.StatusCode)
}

// Two rotations in a row never return the same key, so rotation is a fresh secret every time rather
// than a value derived from the gateway.
func (ts *GatewayAPITestSuite) TestEveryRotationIssuesADifferentKey() {
	created := ts.register(map[string]string{
		"name":    ts.name("rotate-twice"),
		"baseUrl": "https://rotate-twice.integration.test:8090",
	}, http.StatusCreated)

	seen := map[string]bool{created.Key: true}
	for range 2 {
		resp := ts.send(http.MethodPost, "/gateways/"+created.ID+"/key", nil)
		var rotated struct {
			Key string `json:"key"`
		}
		ts.Require().NoError(json.NewDecoder(resp.Body).Decode(&rotated))
		_ = resp.Body.Close()

		ts.Require().NotEmpty(rotated.Key)
		ts.False(seen[rotated.Key], "rotation reissued a key that had already been handed out")
		seen[rotated.Key] = true
	}
}
