package main

import (
  "context"

  "github.com/gin-gonic/gin"
  "github.com/witcher-development/deadzone/db"
  frontendlib "github.com/witcher-development/deadzone/modules/frontend_lib"
)


func main() {
  db.InitDB()

  r := gin.Default()
  r.Static("/static", "./static")
  r.GET("", func(ctx *gin.Context) {
    frontendlib.Page().Render(context.Background(), ctx.Writer)
  })

  // events.Routes(r)

  r.Run()
}
