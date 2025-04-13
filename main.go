package main

import (
	"context"
	"fmt"
	"io"
	"net/http"

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
  })
  static.Static("/static", "./static")

  client := &http.Client{}

  r.GET("tile/:z/:x/:y", func(ctx *gin.Context) {
    z := ctx.Param("z")
    x := ctx.Param("x")
    y := ctx.Param("y")
    
    url := fmt.Sprintf("https://tile.openstreetmap.org/%s/%s/%s.png", z, x, y)
    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
      panic(err)
    }
    for k, v := range ctx.Request.Header {
      for _, hv := range v {
        req.Header.Add(k, hv)
      }
    }
    res, err := client.Do(req)
    if err != nil {
      panic(err)
    }

    defer res.Body.Close()

    body, err := io.ReadAll(res.Body)
    if err != nil {
      panic(err)
    }

    ctx.Header("Cache-Control", "max-age=31536000")

    ctx.Data(res.StatusCode, res.Header.Get("Content-Type"), body)
  })

  r.GET("", func(ctx *gin.Context) {
    frontendlib.Page().Render(context.Background(), ctx.Writer)
  })

  // events.Routes(r)

  r.Run()
}
