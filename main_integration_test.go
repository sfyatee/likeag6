package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

// Integration Test for /api/matrix/add
func TestAddEndpoint(t *testing.T) {
	// input matrices
	reqBody := TwoMatrixRequest{
		A: Matrix{{1, 2}, {3, 4}},
		B: Matrix{{5, 6}, {7, 8}},
	}
	bodyBytes, err := json.Marshal(reqBody)

	if err != nil {
		t.Fatalf("Failed to marshal request: %v", err)
	}

	// Create a new HTTP POST request
	req := httptest.NewRequest(http.MethodPost, "/api/matrix/add", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	// Create a ResponseRecorder to capture the response
	rr := httptest.NewRecorder()

	// call the handler directly
	handleAdd(rr, req)

	// check the status code
	if rr.Code != http.StatusOK {
		t.Fatalf("Expected status 200, observed: %d", rr.Code)
	}

	// parse the response
	var response OneMatrixResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	// define expected result
	expected := Matrix{{6, 8}, {10, 12}}

	// compare
	if !reflect.DeepEqual(response.Result, expected) {
		t.Errorf("Result = %v, expected: %v", response.Result, expected)
	}
	if response.Error != "" {
		t.Errorf("Unexpected error in response: %v", response.Error)
	}
}

// Regression-style test for a previously existing bug where the /api/matrix/add endpoint incorrectly allowed addition of mismatching matrices
func TestAddEndpointRegression_MismatchedDimensions(t *testing.T) {
	// Prepare input matrices with mismatched dimensions
	reqBody := TwoMatrixRequest{
		A: Matrix{{1, 2, 3}},
		B: Matrix{{4, 5}},
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		t.Fatalf("Failed to marshal request: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/matrix/add", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	handleAdd(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected status 400, got %d", rr.Code)
	}

	var resp OneMatrixResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if resp.Error == "" {
		t.Errorf("Expected error message for mismatched dimensions, got none")
	}
}
