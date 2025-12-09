//go:build js && wasm
// +build js,wasm

package main

import (
	"fmt"
	"math"
	"syscall/js"

	"gonum.org/v1/gonum/mat"
)

// This package exposes a small set of matrix operations to JavaScript when
// compiled to WebAssembly. It expects matrices as JS arrays of arrays of
// numbers (e.g. [[1,2],[3,4]]). Each exported function returns an object
// with shape: { result: <matrix or null>, error: <string or null> }.
//
// Exported functions:
// - gonumAdd(A, B)
// - gonumSub(A, B)
// - gonumMul(A, B)
// - gonumRREF(A)
//
// Usage (JS):
//   const res = await gonumAdd(A, B); // res.result or res.error

// helper: convert a JS array-of-arrays into [][]float64
func jsToMatrix(v js.Value) ([][]float64, error) {
	if v.Type() != js.TypeObject {
		return nil, fmt.Errorf("expected array, got %s", v.Type().String())
	}
	// Check length: if not an array, Length will be 0 but may still be object.
	n := v.Length()
	if n == 0 {
		// allow zero-length matrix as valid empty matrix
		return [][]float64{}, nil
	}
	M := make([][]float64, n)
	for i := 0; i < n; i++ {
		row := v.Index(i)
		if row.Type() != js.TypeObject {
			return nil, fmt.Errorf("row %d is not an array", i)
		}
		m := row.Length()
		if m == 0 && row.Length() == 0 {
			// allow empty row (0 columns)
			M[i] = []float64{}
			continue
		}
		r := make([]float64, m)
		for j := 0; j < m; j++ {
			cell := row.Index(j)
			// Convert to float64. If it's not a number, Float() will return 0.
			if cell.Type() != js.TypeNumber {
				// try coercion: call Number(cell) via JS, but keep it simple and fail.
				return nil, fmt.Errorf("cell (%d,%d) is not a number", i, j)
			}
			r[j] = cell.Float()
		}
		M[i] = r
	}
	// Validate rectangularity
	if len(M) > 0 {
		c := len(M[0])
		for i := range M {
			if len(M[i]) != c {
				return nil, fmt.Errorf("row %d has length %d (expected %d)", i, len(M[i]), c)
			}
		}
	}
	return M, nil
}

// helper: convert [][]float64 to a JS array-of-arrays
func matrixToJS(m [][]float64) js.Value {
	outer := make([]interface{}, len(m))
	for i := range m {
		row := make([]interface{}, len(m[i]))
		for j := range m[i] {
			row[j] = m[i][j]
		}
		outer[i] = row
	}
	return js.ValueOf(outer)
}

// convert [][]float64 -> *mat.Dense
func toDense(m [][]float64) *mat.Dense {
	if len(m) == 0 {
		return mat.NewDense(0, 0, nil)
	}
	r := len(m)
	c := len(m[0])
	data := make([]float64, r*c)
	for i := 0; i < r; i++ {
		copy(data[i*c:(i+1)*c], m[i])
	}
	return mat.NewDense(r, c, data)
}

// convert *mat.Dense -> [][]float64
func fromDense(d *mat.Dense) [][]float64 {
	r, c := d.Dims()
	M := make([][]float64, r)
	for i := 0; i < r; i++ {
		row := make([]float64, c)
		for j := 0; j < c; j++ {
			row[j] = d.At(i, j)
		}
		M[i] = row
	}
	return M
}

// rref implementation (Gauss-Jordan with partial pivoting) operating on
// a plain [][]float64. This mirrors typical numeric implementations.
func rrefMatrix(A [][]float64) ([][]float64, error) {
	if len(A) == 0 {
		return [][]float64{}, nil
	}
	r := len(A)
	c := len(A[0])
	// copy matrix to avoid mutating input
	M := make([][]float64, r)
	for i := 0; i < r; i++ {
		if len(A[i]) != c {
			return nil, fmt.Errorf("row %d has length %d (expected %d)", i, len(A[i]), c)
		}
		row := make([]float64, c)
		copy(row, A[i])
		M[i] = row
	}

	const eps = 1e-10
	row := 0
	for col := 0; col < c && row < r; col++ {
		// find pivot
		piv := row
		maxAbs := math.Abs(M[piv][col])
		for i := row + 1; i < r; i++ {
			if v := math.Abs(M[i][col]); v > maxAbs {
				maxAbs = v
				piv = i
			}
		}
		if maxAbs < eps {
			continue
		}
		// swap
		if piv != row {
			M[piv], M[row] = M[row], M[piv]
		}
		// normalize pivot row
		p := M[row][col]
		if math.Abs(p-1.0) > eps {
			for j := col; j < c; j++ {
				M[row][j] /= p
			}
		}
		// eliminate other rows
		for i := 0; i < r; i++ {
			if i == row {
				continue
			}
			f := M[i][col]
			if math.Abs(f) < eps {
				continue
			}
			for j := col; j < c; j++ {
				M[i][j] -= f * M[row][j]
			}
		}
		row++
	}

	// zero-out tiny noise
	for i := 0; i < r; i++ {
		for j := 0; j < c; j++ {
			if math.Abs(M[i][j]) < 1e-12 {
				M[i][j] = 0
			}
		}
	}
	return M, nil
}

// wrapper to produce the standard JS response object
func jsResult(result js.Value, err error) js.Value {
	resObj := map[string]interface{}{
		"result": nil,
		"error":  nil,
	}
	if err != nil {
		resObj["error"] = err.Error()
	} else {
		resObj["result"] = result
	}
	return js.ValueOf(resObj)
}

func registerAdd(this js.Value, args []js.Value) interface{} {
	if len(args) < 2 {
		return jsResult(js.Null(), fmt.Errorf("gonumAdd requires two arguments"))
	}
	A, err := jsToMatrix(args[0])
	if err != nil {
		return jsResult(js.Null(), fmt.Errorf("A: %w", err))
	}
	B, err := jsToMatrix(args[1])
	if err != nil {
		return jsResult(js.Null(), fmt.Errorf("B: %w", err))
	}
	// use gonum
	ad := toDense(A)
	bd := toDense(B)
	ar, ac := ad.Dims()
	br, bc := bd.Dims()
	if ar != br || ac != bc {
		return jsResult(js.Null(), fmt.Errorf("add requires same dimensions, got %dx%d and %dx%d", ar, ac, br, bc))
	}
	rd := mat.NewDense(ar, ac, nil)
	rd.Add(ad, bd)
	return jsResult(matrixToJS(fromDense(rd)), nil)
}

func registerSub(this js.Value, args []js.Value) interface{} {
	if len(args) < 2 {
		return jsResult(js.Null(), fmt.Errorf("gonumSub requires two arguments"))
	}
	A, err := jsToMatrix(args[0])
	if err != nil {
		return jsResult(js.Null(), fmt.Errorf("A: %w", err))
	}
	B, err := jsToMatrix(args[1])
	if err != nil {
		return jsResult(js.Null(), fmt.Errorf("B: %w", err))
	}
	ad := toDense(A)
	bd := toDense(B)
	ar, ac := ad.Dims()
	br, bc := bd.Dims()
	if ar != br || ac != bc {
		return jsResult(js.Null(), fmt.Errorf("subtract requires same dimensions, got %dx%d and %dx%d", ar, ac, br, bc))
	}
	rd := mat.NewDense(ar, ac, nil)
	rd.Sub(ad, bd)
	return jsResult(matrixToJS(fromDense(rd)), nil)
}

func registerMul(this js.Value, args []js.Value) interface{} {
	if len(args) < 2 {
		return jsResult(js.Null(), fmt.Errorf("gonumMul requires two arguments"))
	}
	A, err := jsToMatrix(args[0])
	if err != nil {
		return jsResult(js.Null(), fmt.Errorf("A: %w", err))
	}
	B, err := jsToMatrix(args[1])
	if err != nil {
		return jsResult(js.Null(), fmt.Errorf("B: %w", err))
	}
	ad := toDense(A)
	bd := toDense(B)
	ar, ac := ad.Dims()
	br, bc := bd.Dims()
	if ac != br {
		return jsResult(js.Null(), fmt.Errorf("multiply requires A.cols == B.rows, got %dx%d · %dx%d", ar, ac, br, bc))
	}
	rd := mat.NewDense(ar, bc, nil)
	rd.Mul(ad, bd)
	return jsResult(matrixToJS(fromDense(rd)), nil)
}

func registerRREF(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return jsResult(js.Null(), fmt.Errorf("gonumRREF requires one argument"))
	}
	A, err := jsToMatrix(args[0])
	if err != nil {
		return jsResult(js.Null(), fmt.Errorf("A: %w", err))
	}
	R, err := rrefMatrix(A)
	if err != nil {
		return jsResult(js.Null(), err)
	}
	return jsResult(matrixToJS(R), nil)
}

func main() {
	// expose functions globally
	js.Global().Set("gonumAdd", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		return registerAdd(this, args)
	}))
	js.Global().Set("gonumSub", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		return registerSub(this, args)
	}))
	js.Global().Set("gonumMul", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		return registerMul(this, args)
	}))
	js.Global().Set("gonumRREF", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		return registerRREF(this, args)
	}))

	// keep running
	select {}
}
