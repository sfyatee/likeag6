package main

import (
	"reflect"
	"testing"
)

// Table-driven unit testing for matrix addition
func TestMatrixAdd(t *testing.T) {
	tests := []struct {
		name      string
		a         Matrix
		b         Matrix
		expected  Matrix
		expectErr bool
	}{
		{
			name:      "Valid addition of 2x2 matrices",
			a:         Matrix{{1, 2}, {3, 4}},
			b:         Matrix{{5, 6}, {7, 8}},
			expected:  Matrix{{6, 8}, {10, 12}},
			expectErr: false,
		},
		{
			name:      "Valid addition of 1x3 matrices",
			a:         Matrix{{1, 2, 3}},
			b:         Matrix{{4, 5, 6}},
			expected:  Matrix{{5, 7, 9}},
			expectErr: false,
		},
		{
			name:      "Error: Mismatch of matrix dimensions",
			a:         Matrix{{1, 2, 3}, {3, 4}},
			b:         Matrix{{1}},
			expected:  nil,
			expectErr: true,
		},
		{
			name:      "Error: Matrix A empty",
			a:         Matrix{},
			b:         Matrix{{1, 2}},
			expected:  nil,
			expectErr: true,
		},
	}

	// iterate through all test cases defined above in a single function call with a for loop
	for _, tt := range tests {
		//t.Run will be used to sub-tests for each test case
		t.Run(tt.name, func(t *testing.T) {
			actual, err := add(tt.a, tt.b)

			if (err != nil) != tt.expectErr {
				t.Errorf("add() error status: observed error = %v, want expected error: %v", err, tt.expectErr)
			}

			// reflect.DeepEqual will compare slices (matrices)
			if !reflect.DeepEqual(actual, tt.expected) {
				t.Errorf("add() result: observed = %v, expected: %v", actual, tt.expected)
			}
		})
	}
}

func TestMatrixMultiply(t *testing.T) {
	tests := []struct {
		name      string
		a         Matrix
		b         Matrix
		expected  Matrix
		expectErr bool
	}{
		{
			name:      "Valid multiplication of 2x2 matrices",
			a:         Matrix{{1, 2}, {3, 4}},
			b:         Matrix{{5, 6}, {7, 8}},
			expected:  Matrix{{19, 22}, {43, 50}},
			expectErr: false,
		},
		{
			name:      "Valid multiplication of compatible matrices (e.g., 2x3*3x2)",
			a:         Matrix{{1, 2, 3}, {4, 5, 6}},
			b:         Matrix{{1, 2}, {3, 4}, {5, 6}},
			expected:  Matrix{{22, 28}, {49, 64}},
			expectErr: false,
		},
		{
			name:      "Valid multiplication of a matrix by 0",
			a:         Matrix{{1, 2}, {3, 4}},
			b:         Matrix{{0, 0}, {0, 0}},
			expected:  Matrix{{0, 0}, {0, 0}},
			expectErr: false,
		},
		{
			name:      "Error: Incompatible matrices (e.g. 2x3*2x2)",
			a:         Matrix{{1, 2, 3}, {4, 5, 6}},
			b:         Matrix{{1, 2}, {3, 4}},
			expected:  nil,
			expectErr: true,
		},
	}

	// iterate through all test cases defined above in a single function call with a for loop
	for _, tt := range tests {
		//t.Run will be used to sub-tests for each test case
		t.Run(tt.name, func(t *testing.T) {
			actual, err := mul(tt.a, tt.b)

			if (err != nil) != tt.expectErr {
				t.Errorf("multiply() error status: observed error = %v, want expected error: %v", err, tt.expectErr)
			}

			// reflect.DeepEqual will compare slices (matrices)
			if !reflect.DeepEqual(actual, tt.expected) {
				t.Errorf("multiply() result: observed = %v, expected: %v", actual, tt.expected)
			}
		})
	}
}

func TestRREF(t *testing.T) {
	tests := []struct {
		name      string
		input     Matrix
		expected  Matrix
		expectErr bool
	}{
		{
			name:      "Valid 2x2 identity matrix",
			input:     Matrix{{1, 0}, {0, 1}},
			expected:  Matrix{{1, 0}, {0, 1}},
			expectErr: false,
		},
		{
			name:      "Valid 2x2 zero matrix",
			input:     Matrix{{0, 0}, {0, 0}},
			expected:  Matrix{{0, 0}, {0, 0}},
			expectErr: false,
		},
		{
			name:      "Valid 2x2 invertible matrix",
			input:     Matrix{{1, 2}, {3, 4}},
			expected:  Matrix{{1, 0}, {0, 1}},
			expectErr: false,
		},
		{
			name:      "Error: empty matrix",
			input:     Matrix{},
			expected:  nil,
			expectErr: true,
		},
	}

	// iterate through all test cases defined above in a single function call with a for loop
	for _, tt := range tests {
		//t.Run will be used to sub-tests for each test case
		t.Run(tt.name, func(t *testing.T) {
			actual, err := rref(tt.input)

			if (err != nil) != tt.expectErr {
				t.Errorf("ReducedRowEchelonForm() error status: observed error = %v, want expected error: %v", err, tt.expectErr)
			}

			// reflect.DeepEqual will compare slices (matrices)
			if !reflect.DeepEqual(actual, tt.expected) {
				t.Errorf("ReducedRowEchelonForm() result: observed = %v, expected: %v", actual, tt.expected)
			}
		})
	}
}
