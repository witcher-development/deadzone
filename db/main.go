package db

import (
	"database/sql"

	_ "github.com/ncruces/go-sqlite3/driver"
	_ "github.com/ncruces/go-sqlite3/embed"
)


var schema = `
	create table if not exists zone (
	id integer primary key
	);

	create table if not exists user (
	id integer primary key
	);

	create table if not exists comment (
	id integer primary key,
	text text not null
	);

	create table if not exists comment_user_zone (
	comment_id integer not null,
	user_id integer,
	zone_id integer not null,

	primary key (comment_id, user_id, zone_id),

	foreign key (comment_id)
		references zone (id)
			on delete cascade
			on update no action,

	foreign key (user_id)
		references user (id)
			on delete cascade
			on update no action,

	foreign key (zone_id)
		references zone (id)
			on delete cascade
			on update no action
	);
`

var db *sql.DB

func GetDB() *sql.DB {
	if db == nil {
		var err error
		db, err = sql.Open("sqlite3", "deadzone.db")
		if err != nil {
			panic(err)
		}
		_, err = db.Exec(schema)
		if err != nil {
			panic(err)
		}
	}

	return db
}
