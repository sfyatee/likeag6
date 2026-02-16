package main

import (
	"strings"
	"syscall/js"
	"testing"
)

func mustJSMatrix(t *testing.T, m [][]float64) js.Value {
	t.Helper()
	outer := make([]any, len(m))
	for i := range m {
		row := make([]any, len(m[i]))
		for j := range m[i] {
			row[j] = m[i][j]
		}
		outer[i] = row
	}
	return js.ValueOf(outer)
}

func mustReadResultMatrix(t *testing.T, v js.Value) [][]float64 {
	t.Helper()
	if v.IsUndefined() || v.IsNull() {
		t.Fatalf("expected js value, got %v", v)
	}
	res := v.Get("result")
	if res.IsNull() || res.IsUndefined() {
		t.Fatalf("expected non-null result, got %v (error=%v)", res, v.Get("error"))
	}
	m, err := jsToMatrix(res)
	if err != nil {
		t.Fatalf("jsToMatrix(result) failed: %v", err)
	}
	return m
}

func mustReadError(t *testing.T, v js.Value) string {
	t.Helper()
	errV := v.Get("error")
	if errV.IsNull() || errV.IsUndefined() {
		t.Fatalf("expected error, got null/undefined (result=%v)", v.Get("result"))
	}
	// js.Value.String() on null/undefined is not what we want; we checked above.
	return errV.String()
}

func assertMatrixEq(t *testing.T, got, want [][]float64) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("row count: got %d, want %d\n got=%v\nwant=%v", len(got), len(want), got, want)
	}
	for i := range want {
		if len(got[i]) != len(want[i]) {
			t.Fatalf("col count row %d: got %d, want %d\n got=%v\nwant=%v", i, len(got[i]), len(want[i]), got, want)
		}
		for j := range want[i] {
			if got[i][j] != want[i][j] {
				t.Fatalf("cell (%d,%d): got %v, want %v\n got=%v\nwant=%v", i, j, got[i][j], want[i][j], got, want)
			}
		}
	}
}

func Test_jsToMatrix_RectangularAndTypeChecks(t *testing.T) {
	// Non-array object with Length() == 0 is treated as an "empty matrix" by current code.
	// This is intentional per jsToMatrix's comment, so we regression-test it.
	obj := js.Global().Get("Object").New()
	m, err := jsToMatrix(obj)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	assertMatrixEq(t, m, [][]float64{})

	// Ragged should error.
	ragged := js.ValueOf([]any{
		[]any{1, 2},
		[]any{3},
	})
	_, err = jsToMatrix(ragged)
	if err == nil || !strings.Contains(err.Error(), "row 1 has length") {
		t.Fatalf("expected ragged error, got: %v", err)
	}

	// Non-number cell should error.
	badCell := js.ValueOf([]any{
		[]any{1, "x"},
	})
	_, err = jsToMatrix(badCell)
	if err == nil || !strings.Contains(err.Error(), "is not a number") {
		t.Fatalf("expected cell type error, got: %v", err)
	}

	// Empty rows are allowed.
	emptyRow := js.ValueOf([]any{
		[]any{},
		[]any{},
	})
	m, err = jsToMatrix(emptyRow)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	assertMatrixEq(t, m, [][]float64{{}, {}})
}

func Test_matrixToJS_RoundTrip(t *testing.T) {
	in := [][]float64{{1, 2.5}, {-3, 0}}
	v := matrixToJS(in)
	out, err := jsToMatrix(v)
	if err != nil {
		t.Fatalf("roundtrip failed: %v", err)
	}
	assertMatrixEq(t, out, in)
}

func Test_rrefMatrix_Basic(t *testing.T) {
	A := [][]float64{
		{1, 2, 1, 4},
		{2, 4, 0, 2},
	}
	got, err := rrefMatrix(A)
	if err != nil {
		t.Fatalf("rrefMatrix error: %v", err)
	}
	// Expected RREF:
	// [1 2 0 1]
	// [0 0 1 3]
	want := [][]float64{
		{1, 2, 0, 1},
		{0, 0, 1, 3},
	}
	assertMatrixEq(t, got, want)

	// Ensure input not mutated.
	assertMatrixEq(t, A, [][]float64{
		{1, 2, 1, 4},
		{2, 4, 0, 2},
	})
}

func Test_rrefMatrix_ZeroAndEmpty(t *testing.T) {
	// Empty matrix.
	got, err := rrefMatrix([][]float64{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	assertMatrixEq(t, got, [][]float64{})

	// All-zero matrix -> stays zeros.
	A := [][]float64{
		{0, 0},
		{0, 0},
	}
	got, err = rrefMatrix(A)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	assertMatrixEq(t, got, A)
}

func Test_registerAdd_Sub_Mul_Success(t *testing.T) {
	A := mustJSMatrix(t, [][]float64{{1, 2}, {3, 4}})
	B := mustJSMatrix(t, [][]float64{{10, 20}, {30, 40}})

	add := registerAdd(js.Null(), []js.Value{A, B}).(js.Value)
	assertMatrixEq(t, mustReadResultMatrix(t, add), [][]float64{{11, 22}, {33, 44}})

	sub := registerSub(js.Null(), []js.Value{B, A}).(js.Value)
	assertMatrixEq(t, mustReadResultMatrix(t, sub), [][]float64{{9, 18}, {27, 36}})

	C := mustJSMatrix(t, [][]float64{{1, 2, 3}, {4, 5, 6}})
	D := mustJSMatrix(t, [][]float64{{7, 8}, {9, 10}, {11, 12}})
	mul := registerMul(js.Null(), []js.Value{C, D}).(js.Value)
	// [[ 58,  64],
	//  [139, 154]]
	assertMatrixEq(t, mustReadResultMatrix(t, mul), [][]float64{{58, 64}, {139, 154}})
}

func Test_registerAdd_Sub_Mul_DimensionErrors(t *testing.T) {
	A := mustJSMatrix(t, [][]float64{{1, 2}})
	B := mustJSMatrix(t, [][]float64{{1, 2}, {3, 4}})

	add := registerAdd(js.Null(), []js.Value{A, B}).(js.Value)
	if msg := mustReadError(t, add); !strings.Contains(msg, "add requires same dimensions") {
		t.Fatalf("unexpected add error: %q", msg)
	}

	sub := registerSub(js.Null(), []js.Value{A, B}).(js.Value)
	if msg := mustReadError(t, sub); !strings.Contains(msg, "subtract requires same dimensions") {
		t.Fatalf("unexpected sub error: %q", msg)
	}

	// Mul dimension mismatch: A is 1x2, B is 2x2 OK; make B 3x1 mismatch.
	M := mustJSMatrix(t, [][]float64{{1, 2}})
	N := mustJSMatrix(t, [][]float64{{1}, {2}, {3}})
	mul := registerMul(js.Null(), []js.Value{M, N}).(js.Value)
	if msg := mustReadError(t, mul); !strings.Contains(msg, "multiply requires A.cols == B.rows") {
		t.Fatalf("unexpected mul error: %q", msg)
	}
}

func Test_registerRREF_SuccessAndArgErrors(t *testing.T) {
	A := mustJSMatrix(t, [][]float64{
		{1, 2, 1, 4},
		{2, 4, 0, 2},
	})
	r := registerRREF(js.Null(), []js.Value{A}).(js.Value)
	assertMatrixEq(t, mustReadResultMatrix(t, r), [][]float64{
		{1, 2, 0, 1},
		{0, 0, 1, 3},
	})

	// Missing argument.
	r2 := registerRREF(js.Null(), nil).(js.Value)
	if msg := mustReadError(t, r2); !strings.Contains(msg, "gonumRREF requires one argument") {
		t.Fatalf("unexpected error: %q", msg)
	}
}

func Test_registerAdd_ArgValidation(t *testing.T) {
	// Missing args
	v := registerAdd(js.Null(), nil).(js.Value)
	if msg := mustReadError(t, v); !strings.Contains(msg, "gonumAdd requires two arguments") {
		t.Fatalf("unexpected error: %q", msg)
	}

	// Bad A
	badA := js.ValueOf([]any{[]any{1, "x"}})
	goodB := mustJSMatrix(t, [][]float64{{1, 2}})
	v2 := registerAdd(js.Null(), []js.Value{badA, goodB}).(js.Value)
	if msg := mustReadError(t, v2); !strings.HasPrefix(msg, "A:") {
		t.Fatalf("expected A: prefix, got: %q", msg)
	}

	// Bad B
	goodA := mustJSMatrix(t, [][]float64{{1, 2}})
	badB := js.ValueOf([]any{[]any{1, "x"}})
	v3 := registerAdd(js.Null(), []js.Value{goodA, badB}).(js.Value)
	if msg := mustReadError(t, v3); !strings.HasPrefix(msg, "B:") {
		t.Fatalf("expected B: prefix, got: %q", msg)
	}
}

func Test_jsResult_Shape(t *testing.T) {
	ok := jsResult(js.ValueOf(123), nil)
	if ok.Get("error").IsNull() != true {
		t.Fatalf("expected error=null, got %v", ok.Get("error"))
	}
	if ok.Get("result").Type() != js.TypeNumber || ok.Get("result").Int() != 123 {
		t.Fatalf("expected result=123, got %v", ok.Get("result"))
	}

	bad := jsResult(js.Null(), js.Error{Value: js.ValueOf("nope")})
	// js.Error.Error() includes the value; we just check that error is non-null string.
	if bad.Get("result").IsNull() != true {
		t.Fatalf("expected result=null, got %v", bad.Get("result"))
	}
	if bad.Get("error").Type() != js.TypeString || bad.Get("error").String() == "" {
		t.Fatalf("expected non-empty error string, got %v", bad.Get("error"))
	}
}
