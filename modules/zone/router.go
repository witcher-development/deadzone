package zone

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/a-h/templ"
	"github.com/gin-gonic/gin"
	"github.com/witcher-development/deadzone/db"

	frontendlib "github.com/witcher-development/deadzone/modules/frontend_lib"
	model "github.com/witcher-development/deadzone/modules/zone/model"
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

		joined := templ.Join(
			ui.Zones(zones),
			ui.ZonesJSON(zones),
			ui.MapMarkers(zones),
		)
		if (wrap) {
			joined2 := templ.Join(joined, ui.Map())
			ctx := templ.WithChildren(context.Background(), joined2)
			frontendlib.Page().Render(ctx, r.Writer)
		} else {
			joined.Render(context.Background(), r.Writer)
		}
	})

	r.GET(":id", func(r *gin.Context) {
		idS := r.Param("id")
		wrap := true
		if query := r.Query("w"); query == "f" {
			wrap = false
		}

		id, err := strconv.Atoi(idS)
		if err != nil {
			http.Error(r.Writer, "", http.StatusInternalServerError)
			return
		}

		zone, err := GetOne(id)
		if err != nil {
			http.Error(r.Writer, "", http.StatusInternalServerError)
			return
		}

		zones := []model.Zone{zone}
		joined := templ.Join(
			ui.Zones(zones),
		)
		if (wrap) {
			joined2 := templ.Join(
				ui.Zones(zones),
				ui.ZonesJSON(zones),
				ui.MapMarkers(zones),
				ui.Map(),
				)
			ctx := templ.WithChildren(context.Background(), joined2)
			frontendlib.Page().Render(ctx, r.Writer)
		} else {
			joined.Render(context.Background(), r.Writer)
		}
	})

	r.DELETE(":id", func(r *gin.Context) {
		idS := r.Param("id")

		id, err := strconv.Atoi(idS)
		if err != nil {
			http.Error(r.Writer, "", http.StatusInternalServerError)
			return
		}

		// err = DeleteOne(id)
		// if err != nil {
		// 	http.Error(r.Writer, "", http.StatusInternalServerError)
		// 	return
		// }

		// r.Status()
		r.Header("HX-Trigger", fmt.Sprintf("{\"delete-zone\": \"%d\"}", id))
		r.Data(http.StatusOK, gin.MIMEHTML, nil)

		// zones := []model.Zone{zone}
		// joined := templ.Join(
		// 	ui.Zones(zones),
		// )
		// if (wrap) {
		// 	joined2 := templ.Join(
		// 		ui.Zones(zones),
		// 		ui.ZonesJSON(zones),
		// 		ui.MapMarkers(zones),
		// 		ui.Map(),
		// 		)
		// 	ctx := templ.WithChildren(context.Background(), joined2)
		// 	frontendlib.Page().Render(ctx, r.Writer)
		// } else {
		// 	joined.Render(context.Background(), r.Writer)
		// }
	})
}
