package zone

import (
	"fmt"
	"net/http"
)

func GetRouter() *http.ServeMux {
	router := http.NewServeMux()
	router.HandleFunc("POST /", func(w http.ResponseWriter, r *http.Request) {
		id, err := createZone()
		if err != nil {
			fmt.Fprintf(w, "fuck")
			fmt.Println(err)
			return
		}
		fmt.Fprintf(w, "good: %d", id)
	})

	return router
}
