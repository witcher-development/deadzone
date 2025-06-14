package zone


import _ "embed"

//go:embed sql/insert.sql
var CreateOperation string
