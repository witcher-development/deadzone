package zone

import (
	"github.com/witcher-development/deadzone/db"
	model "github.com/witcher-development/deadzone/modules/zone/model"
)

func GetAll() ([]model.Zone, error) {
	db := db.GetDB()

	rows, err := db.Query(GetAllOperation)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var zones []model.Zone

	for rows.Next() {
		var zone model.Zone
		if err := rows.Scan(&zone.Id, &zone.Polygon); err != nil {
			return nil, err
		}
		zones = append(zones, zone)
	}
	
	return zones, nil
}
