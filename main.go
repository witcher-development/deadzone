package main

import (
	"github.com/gin-gonic/gin"
	"github.com/witcher-development/deadzone/db"
)


func main() {
  db.InitDB()

  r := gin.Default()
  r.Static("/static", "./static")

  // events.Routes(r)

  r.Run()
}
