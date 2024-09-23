package db

import (
	"database/sql"

	_ "github.com/ncruces/go-sqlite3/driver"
	_ "github.com/ncruces/go-sqlite3/embed"
)

var db *sql.DB

func GetDB() *sql.DB {
	if db == nil {
		var err error
		db, err = sql.Open("sqlite3", "deadzone.db")
		if err != nil {
			panic(err)
		}
	}

	return db
}
