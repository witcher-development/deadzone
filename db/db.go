package db

import (
	"database/sql"
	_ "embed"

	_ "github.com/ncruces/go-sqlite3/driver"
	_ "github.com/ncruces/go-sqlite3/embed"
)

//go:embed schema.sql
var schema string
var db *sql.DB

func InitDB() {
	var err error
	db, err = sql.Open("sqlite3", "db.sqlite")
	if err != nil {
		panic(err)
	}
	_, err = db.Exec(schema)
	if err != nil {
		panic(err)
	}
}
func GetDB() *sql.DB {
	if db == nil {
		InitDB()
	}

	return db
}
