package main

import (
	"math"
	"reflect"
	"testing"
)

// ============ TEST HELPERS ============

// floatTolerance is the maximum allowed absolute difference when comparing
// floating-point matrix results in tests.
const floatTolerance = 1e-9

// matricesAlmostEqual reports whether two matrices match within floatTolerance.
func matricesAlmostEqual(a, b Matrix) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if len(a[i]) != len(b[i]) {
			return false
		}
		for j := range a[i] {
			if math.Abs(a[i][j]-b[i][j]) > floatTolerance {
				return false
			}
		}
	}
	return true
}

// twoMatrixTestCase defines one table-driven case for binary matrix operations.
type twoMatrixTestCase struct {
	name      string
	a         Matrix
	b         Matrix
	expected  Matrix
	expectErr bool
}

// oneMatrixTestCase defines one table-driven case for unary matrix operations.
type oneMatrixTestCase struct {
	name      string
	input     Matrix
	expected  Matrix
	expectErr bool
}

// runTwoMatrixTests executes a table of binary matrix operation test cases.
func runTwoMatrixTests(t *testing.T, tests []twoMatrixTestCase, op func(Matrix, Matrix) (Matrix, error), opName string) {
	t.Helper()
	for _, tt := range tests {
		tt := tt // capture range variable for parallel execution
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			actual, err := op(tt.a, tt.b)

			if (err != nil) != tt.expectErr {
				t.Errorf("%s() error status: observed error = %v, want expected error: %v", opName, err, tt.expectErr)
			}

			if !reflect.DeepEqual(actual, tt.expected) {
				t.Errorf("%s() result: observed = %v, expected: %v", opName, actual, tt.expected)
			}
		})
	}
}

// runOneMatrixTests executes a table of unary matrix operation test cases.
// It uses tolerance-based comparisons for floating-point outputs.
func runOneMatrixTests(t *testing.T, tests []oneMatrixTestCase, op func(Matrix) (Matrix, error), opName string) {
	t.Helper()
	for _, tt := range tests {
		tt := tt // capture range variable for parallel execution
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			actual, err := op(tt.input)

			if (err != nil) != tt.expectErr {
				t.Errorf("%s() error status: observed error = %v, want expected error: %v", opName, err, tt.expectErr)
			}

			// Use tolerance-based comparison for floating-point operations
			if !matricesAlmostEqual(actual, tt.expected) {
				t.Errorf("%s() result: observed = %v, expected: %v", opName, actual, tt.expected)
			}
		})
	}
}

// ============ TESTS ============

// TestMatrixAdd verifies add for valid and invalid dimension scenarios.
func TestMatrixAdd(t *testing.T) {
	t.Parallel()
	tests := []twoMatrixTestCase{
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

	runTwoMatrixTests(t, tests, add, "add")
}

// TestMatrixSub verifies subtract behavior for valid and invalid inputs.
func TestMatrixSub(t *testing.T) {
	t.Parallel()
	tests := []twoMatrixTestCase{
		{
			name:      "Valid subtraction of 2x2 matrices",
			a:         Matrix{{5, 6}, {7, 8}},
			b:         Matrix{{1, 2}, {3, 4}},
			expected:  Matrix{{4, 4}, {4, 4}},
			expectErr: false,
		},
		{
			name:      "Valid subtraction of 1x3 matrices",
			a:         Matrix{{10, 20, 30}},
			b:         Matrix{{4, 5, 6}},
			expected:  Matrix{{6, 15, 24}},
			expectErr: false,
		},
		{
			name:      "Valid subtraction resulting in negatives",
			a:         Matrix{{1, 2}, {3, 4}},
			b:         Matrix{{5, 6}, {7, 8}},
			expected:  Matrix{{-4, -4}, {-4, -4}},
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

	runTwoMatrixTests(t, tests, sub, "sub")
}

// TestMatrixMultiply verifies multiplication rules and shape compatibility.
func TestMatrixMultiply(t *testing.T) {
	t.Parallel()
	tests := []twoMatrixTestCase{
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
		{
			name:      "Identity matrix multiplication (A * I = A)",
			a:         Matrix{{1, 2}, {3, 4}},
			b:         Matrix{{1, 0}, {0, 1}},
			expected:  Matrix{{1, 2}, {3, 4}},
			expectErr: false,
		},
		{
			name:      "Valid 1x1 matrix multiplication",
			a:         Matrix{{5}},
			b:         Matrix{{3}},
			expected:  Matrix{{15}},
			expectErr: false,
		},
	}

	runTwoMatrixTests(t, tests, mul, "multiply")
}

// TestRREF verifies reduced row echelon conversion and edge cases.
func TestRREF(t *testing.T) {
	t.Parallel()
	tests := []oneMatrixTestCase{
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
		{
			name:      "Valid 3x3 matrix requiring row swaps",
			input:     Matrix{{0, 1, 2}, {1, 2, 3}, {2, 3, 5}},
			expected:  Matrix{{1, 0, 0}, {0, 1, 0}, {0, 0, 1}},
			expectErr: false,
		},
		{
			name:      "Valid 1x1 matrix",
			input:     Matrix{{5}},
			expected:  Matrix{{1}},
			expectErr: false,
		},
		{
			name:      "Singular matrix (row of zeros)",
			input:     Matrix{{1, 2}, {2, 4}},
			expected:  Matrix{{1, 2}, {0, 0}},
			expectErr: false,
		},
	}

	runOneMatrixTests(t, tests, rref, "rref")
}

// ============ BENCHMARKS ============

// BenchmarkMatrixAdd measures baseline performance of small matrix addition.
func BenchmarkMatrixAdd(b *testing.B) {
	a := Matrix{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}
	matrixB := Matrix{{9, 8, 7}, {6, 5, 4}, {3, 2, 1}}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = add(a, matrixB)
	}
}

// BenchmarkMatrixMultiply measures baseline performance of small multiplication.
func BenchmarkMatrixMultiply(b *testing.B) {
	a := Matrix{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}
	matrixB := Matrix{{9, 8, 7}, {6, 5, 4}, {3, 2, 1}}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = mul(a, matrixB)
	}
}

// BenchmarkRREF measures baseline performance of RREF computation.
func BenchmarkRREF(b *testing.B) {
	m := Matrix{{1, 2, 3}, {4, 5, 6}, {7, 8, 10}}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = rref(m)
	}
}

// BenchmarkLargeMatrixMultiply measures multiplication cost for 10x10 matrices.
func BenchmarkLargeMatrixMultiply(b *testing.B) {
	// Create 10x10 matrices
	size := 10
	a := make(Matrix, size)
	matrixB := make(Matrix, size)
	for i := 0; i < size; i++ {
		a[i] = make([]float64, size)
		matrixB[i] = make([]float64, size)
		for j := 0; j < size; j++ {
			a[i][j] = float64(i*size + j)
			matrixB[i][j] = float64((size-i)*size + j)
		}
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = mul(a, matrixB)
	}
}
