package zone

import (
	"context"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/witcher-development/deadzone/db"
	ui "github.com/witcher-development/deadzone/modules/zone/ui"
)


func Routes(route *gin.Engine) {
	r := route.Group("/zone")

	r.POST("", func(ctx *gin.Context) {
		db := db.GetDB()
		body, err := io.ReadAll(ctx.Request.Body)
		if err != nil {
			http.Error(ctx.Writer, "", http.StatusBadRequest)
			return
		}

		_, err = db.Exec(CreateOperation, string(body))
		if err != nil {
			http.Error(ctx.Writer, "", http.StatusInternalServerError)
			return
		}

	})

	r.GET("", func(ctx *gin.Context) {
		zones, err := GetAll()
		if err != nil {
			http.Error(ctx.Writer, "", http.StatusInternalServerError)
		}

		ui.ZonesJSON(zones).Render(context.Background(), ctx.Writer)
	})
}
