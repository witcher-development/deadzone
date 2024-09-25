package zone

import (
	"context"
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

	router.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		Tile(&Zone{Id: 3}).Render(context.Background(), w)
	})

	return router
}
