package zone

import (
	"deadzone/db"
	"fmt"
	"net/http"
)

func GetRouter() *http.ServeMux {
	router := http.NewServeMux()
	router.HandleFunc("POST /", func(w http.ResponseWriter, r *http.Request) {
		var version string
		a := db.GetDB()
		fmt.Println(r.Method)
		// data, err := io.ReadAll(r.Body)
		// if err != nil {
		// 	panic(err)
		// }
		// query := r.PathValue("test")
		a.QueryRow("Select sqlite_version()").Scan(&version)
		fmt.Fprintf(w, version)
	})

	return router
}
