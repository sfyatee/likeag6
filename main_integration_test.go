package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

// ============ INTEGRATION TEST HELPERS ============

// endpointTestCase defines one HTTP handler test case with request and expected response data.
type endpointTestCase struct {
	name           string
	method         string
	body           interface{}
	handler        http.HandlerFunc
	expectedStatus int
	expectedResult Matrix
	expectError    bool
}

// runEndpointTests executes table-driven tests against a handler function.
func runEndpointTests(t *testing.T, tests []endpointTestCase, endpoint string) {
	t.Helper()
	for _, tt := range tests {
		tt := tt // capture range variable
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			var bodyBytes []byte
			var err error
			if tt.body != nil {
				bodyBytes, err = json.Marshal(tt.body)
				if err != nil {
					t.Fatalf("Failed to marshal request: %v", err)
				}
			}

			req := httptest.NewRequest(tt.method, endpoint, bytes.NewReader(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			rr := httptest.NewRecorder()

			tt.handler(rr, req)

			if rr.Code != tt.expectedStatus {
				t.Fatalf("Expected status %d, observed: %d", tt.expectedStatus, rr.Code)
			}

			// Only parse response for successful requests
			if tt.expectedStatus == http.StatusOK {
				var response OneMatrixResponse
				if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
					t.Fatalf("Failed to unmarshal response: %v", err)
				}

				if !reflect.DeepEqual(response.Result, tt.expectedResult) {
					t.Errorf("Result = %v, expected: %v", response.Result, tt.expectedResult)
				}
				if response.Error != "" && !tt.expectError {
					t.Errorf("Unexpected error in response: %v", response.Error)
				}
			}
		})
	}
}

// ============ ADD ENDPOINT TESTS ============

// TestAddEndpoint verifies /api/matrix/add behavior for success, bad input, and method validation.
func TestAddEndpoint(t *testing.T) {
	t.Parallel()
	tests := []endpointTestCase{
		{
			name:   "Valid addition of 2x2 matrices",
			method: http.MethodPost,
			body: TwoMatrixRequest{
				A: Matrix{{1, 2}, {3, 4}},
				B: Matrix{{5, 6}, {7, 8}},
			},
			handler:        handleAdd,
			expectedStatus: http.StatusOK,
			expectedResult: Matrix{{6, 8}, {10, 12}},
			expectError:    false,
		},
		{
			name:   "Mismatched dimensions",
			method: http.MethodPost,
			body: TwoMatrixRequest{
				A: Matrix{{1, 2, 3}},
				B: Matrix{{4, 5}},
			},
			handler:        handleAdd,
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
		{
			name:           "Wrong HTTP method (GET)",
			method:         http.MethodGet,
			body:           nil,
			handler:        handleAdd,
			expectedStatus: http.StatusMethodNotAllowed,
			expectError:    true,
		},
	}

	runEndpointTests(t, tests, "/api/matrix/add")
}

// ============ SUBTRACT ENDPOINT TESTS ============

// TestSubEndpoint verifies /api/matrix/subtract behavior for success and method validation.
func TestSubEndpoint(t *testing.T) {
	t.Parallel()
	tests := []endpointTestCase{
		{
			name:   "Valid subtraction of 2x2 matrices",
			method: http.MethodPost,
			body: TwoMatrixRequest{
				A: Matrix{{5, 6}, {7, 8}},
				B: Matrix{{1, 2}, {3, 4}},
			},
			handler:        handleSub,
			expectedStatus: http.StatusOK,
			expectedResult: Matrix{{4, 4}, {4, 4}},
			expectError:    false,
		},
		{
			name:           "Wrong HTTP method (GET)",
			method:         http.MethodGet,
			body:           nil,
			handler:        handleSub,
			expectedStatus: http.StatusMethodNotAllowed,
			expectError:    true,
		},
	}

	runEndpointTests(t, tests, "/api/matrix/sub")
}

// ============ MULTIPLY ENDPOINT TESTS ============

// TestMulEndpoint verifies /api/matrix/multiply behavior for compatible and incompatible shapes.
func TestMulEndpoint(t *testing.T) {
	t.Parallel()
	tests := []endpointTestCase{
		{
			name:   "Valid multiplication of 2x2 matrices",
			method: http.MethodPost,
			body: TwoMatrixRequest{
				A: Matrix{{1, 2}, {3, 4}},
				B: Matrix{{5, 6}, {7, 8}},
			},
			handler:        handleMul,
			expectedStatus: http.StatusOK,
			expectedResult: Matrix{{19, 22}, {43, 50}},
			expectError:    false,
		},
		{
			name:   "Incompatible dimensions for multiplication",
			method: http.MethodPost,
			body: TwoMatrixRequest{
				A: Matrix{{1, 2, 3}},
				B: Matrix{{4, 5}},
			},
			handler:        handleMul,
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
	}

	runEndpointTests(t, tests, "/api/matrix/mul")
}

// ============ RREF ENDPOINT TESTS ============

// TestRREFEndpoint verifies /api/matrix/rref behavior and method enforcement.
func TestRREFEndpoint(t *testing.T) {
	t.Parallel()
	tests := []endpointTestCase{
		{
			name:   "Valid RREF of 2x2 matrix",
			method: http.MethodPost,
			body: OneMatrixRequest{
				A: Matrix{{1, 2}, {3, 4}},
			},
			handler:        handleRREF,
			expectedStatus: http.StatusOK,
			expectedResult: Matrix{{1, 0}, {0, 1}},
			expectError:    false,
		},
		{
			name:           "Wrong HTTP method (PUT)",
			method:         http.MethodPut,
			body:           nil,
			handler:        handleRREF,
			expectedStatus: http.StatusMethodNotAllowed,
			expectError:    true,
		},
	}

	runEndpointTests(t, tests, "/api/matrix/rref")
}

// ============ REGRESSION TESTS ============

// TestAddEndpointRegression_MismatchedDimensions guards against a previous bug
// where mismatched matrices were accepted by /api/matrix/add.
func TestAddEndpointRegression_MismatchedDimensions(t *testing.T) {
	t.Parallel()
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
