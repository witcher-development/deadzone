package main

import (
	"deadzone/db"
	"deadzone/zone"
	"log"
	"net/http"
)

func main() {
	router := http.NewServeMux()
	router.Handle("/zone", zone.GetRouter())

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
