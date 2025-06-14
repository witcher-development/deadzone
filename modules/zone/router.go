package zone

import (
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/witcher-development/deadzone/db"
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
			fmt.Println(err)
			http.Error(ctx.Writer, "", http.StatusInternalServerError)
			return
		}

		// event, err := GetEvent(id)
		// if err != nil {
		// 	http.Error(ctx.Writer, "", http.StatusInternalServerError)
		// 	return
		// }
		//
		// ui.Page(event).Render(context.Background(), ctx.Writer)
	})
}
