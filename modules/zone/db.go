package zone


import _ "embed"

//go:embed sql/insert.sql
var CreateOperation string

//go:embed sql/get_all.sql
var GetAllOperation string

//go:embed sql/get_one.sql
var GetOneOperation string

//go:embed sql/delete_one.sql
var DeleteOneOperation string
