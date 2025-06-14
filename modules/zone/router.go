package zone

import (
	"context"
	"io"
	"net/http"

	"github.com/a-h/templ"
	"github.com/gin-gonic/gin"
	"github.com/witcher-development/deadzone/db"

	frontendlib "github.com/witcher-development/deadzone/modules/frontend_lib"
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

	r.GET("", func(r *gin.Context) {
		wrap := true
		if query := r.Query("w"); query == "f" {
			wrap = false
		}

		zones, err := GetAll()
		if err != nil {
			http.Error(r.Writer, "", http.StatusInternalServerError)
			return
		}

		joined := templ.Join(ui.Zones(zones), ui.ZonesJSON(zones))
		if (wrap) {
			ctx := templ.WithChildren(context.Background(), joined)
			frontendlib.Page().Render(ctx, r.Writer)
		} else {
			joined.Render(context.Background(), r.Writer)
		}
	})
}
