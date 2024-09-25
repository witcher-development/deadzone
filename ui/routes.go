package ui

import (
	"context"
	"net/http"
)


func Index(w http.ResponseWriter, r *http.Request) {
	index().Render(context.Background(), w)
}
