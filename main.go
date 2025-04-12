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
  static := r.Group("/")
  static.Use(func(c *gin.Context) {
    c.Writer.Header().Set("Cache-Control", "public, max-age=0, immutable")
    // TODO: only apply to SW
    c.Writer.Header().Set("Service-Worker-Allowed", "/")
  })
  static.Static("/static", "./static")

  r.GET("", func(ctx *gin.Context) {
    frontendlib.Page().Render(context.Background(), ctx.Writer)
  })

  // events.Routes(r)

  r.Run()
}
