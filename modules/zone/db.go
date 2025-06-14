package zone


import _ "embed"

//go:embed sql/insert.sql
var CreateOperation string

//go:embed sql/get_all.sql
var GetAllOperation string
