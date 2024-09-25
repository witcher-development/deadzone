package main

import (
	"deadzone/db"
	"deadzone/ui"
	"deadzone/zone"
	"log"
	"net/http"
)

func main() {
	router := http.NewServeMux()
	router.Handle("/zone", zone.GetRouter())

	router.HandleFunc("GET /{$}", ui.Index)
	router.Handle("GET /static/", http.StripPrefix("/static", http.FileServer(http.Dir("./ui/static"))))

	server := http.Server{
		Addr:    ":3000",
		Handler: router,
	}
	defer server.Close()

	a := db.GetDB()
	defer a.Close()

	server.ListenAndServe()
	log.Fatal("done")
}
