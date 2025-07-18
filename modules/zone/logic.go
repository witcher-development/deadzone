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

	var zones = []model.Zone{}

	for rows.Next() {
		var zone model.Zone
		if err := rows.Scan(&zone.Id, &zone.Polygon); err != nil {
			return nil, err
		}
		zones = append(zones, zone)
	}
	
	return zones, nil
}


func GetOne(id int) (model.Zone, error) {
	db := db.GetDB()

	var zone model.Zone
	row := db.QueryRow(DeleteOneOperation, id)
	if err := row.Scan(&zone.Id, &zone.Polygon); err != nil {
		return zone, err
	}

	return zone, nil
}

func DeleteOne(id int) error {
	db := db.GetDB()

	_, err := db.Exec(DeleteOneOperation, id)
	return err
}
