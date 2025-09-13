package main

import (
	"fmt"

	"gonum.org/v1/gonum/mat"
)

func main() {
	n := 5
	s := mat.NewSymDense(5, nil)
	count := 1.0
	for i := 0; i < n; i++ {
		for j := i; j < n; j++ {
			s.SetSym(i, j, count)
			count++
		}
	}
	fmt.Println("Original matrix:")
	fmt.Printf("%0.4v\n\n", mat.Formatted(s))

	// Take the subset {0, 2, 4}
	var sub mat.SymDense
	sub.SubsetSym(s, []int{0, 2, 4})
	fmt.Println("Subset {0, 2, 4}")
	fmt.Printf("%0.4v\n\n", mat.Formatted(&sub))

	// Take the subset {0, 0, 4}
	sub.SubsetSym(s, []int{0, 0, 4})
	fmt.Println("Subset {0, 0, 4}")
	fmt.Printf("%0.4v\n\n", mat.Formatted(&sub))

}
