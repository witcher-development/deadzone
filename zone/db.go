package zone

import "deadzone/db"


func createZone() (int, error) {
	d := db.GetDB()
	res, err := d.Exec(`
		insert into zone 
		default values;
	`)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()	
	if err != nil {
		return 0, err
	}

	return int(id), nil
}
