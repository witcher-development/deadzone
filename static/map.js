/**
 * @typedef {Object} Coord
 * @property {number} x
 * @property {number} xTileOff
 * @property {number} y
 * @property {number} yTileOff
 * @property {number} z
 */

/** @type Coord */
const DEFAULT_COORDS = {
	x: 17.1250631,
	xTileOff: 0,
	y: 48.1435711,
	yTileOff: 0,
	z: 15
}

const TILE_SIZE = 256

// https://tile.openstreetmap.org/{z}/{x}/{y}.png
/**
 * @param {Coord} coord 
 * @returns {Coord}
 */
// TODO: handle biggest zooms
function latLonToTile({ x, y, z }) {
	const n = Math.pow(2, z);

	const xTileAbs = (x + 180) / 360 * n
	const xTile = Math.floor(xTileAbs);
	const xTileOff = Math.floor((xTileAbs - xTile) * TILE_SIZE)

	const latRad = y * Math.PI / 180;
	const yTileAbs = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n
	const yTile = Math.floor(yTileAbs);
	const yTileOff = Math.floor((yTileAbs - yTile) * TILE_SIZE)

	return { x: xTile, xTileOff, y: yTile, yTileOff, z };
}

const canvas = /** @type HTMLCanvasElement */ (document.querySelector("#map"))
const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext("2d"))

function render() {
	const W = document.body.clientWidth * 2
	const H = document.body.clientHeight * 2
	canvas.width = W
	canvas.height = H
	ctx.fillStyle = "#000"
	ctx.fillRect(0, 0, W, H)

	const firstTile = latLonToTile(DEFAULT_COORDS)
	const X_TILE_OFF = firstTile.xTileOff
	const Y_TILE_OFF = firstTile.yTileOff
	getTileData(firstTile, (image) => {
		ctx.drawImage(image, W/2 - X_TILE_OFF, H/2 - Y_TILE_OFF)
	})
	drawTop(W/2 - X_TILE_OFF, H, Y_TILE_OFF, Object.assign({}, firstTile))
	drawBottom(W/2 - X_TILE_OFF, H, Y_TILE_OFF, Object.assign({}, firstTile))

	const leftCursor = Object.assign({}, firstTile)
	// move left
	for (let i = X_TILE_OFF; i < W + X_TILE_OFF; i += TILE_SIZE) {
		leftCursor.x -= 1
		const w = W/2 - i - TILE_SIZE
		getTileData(leftCursor, (image) => {
			ctx.drawImage(image, w, H/2 - Y_TILE_OFF)
		})
		drawTop(w, H, Y_TILE_OFF, Object.assign({}, leftCursor))
		drawBottom(w, H, Y_TILE_OFF, Object.assign({}, leftCursor))
	}

	const rightCursor = Object.assign({}, firstTile)
	// move right
	for (let i = TILE_SIZE - X_TILE_OFF; i < W + X_TILE_OFF; i += TILE_SIZE) {
		rightCursor.x += 1
		const w = W/2 + i
		getTileData(rightCursor, (image) => {
			ctx.drawImage(image, w, H/2 - Y_TILE_OFF)
		})
		drawTop(w, H, Y_TILE_OFF, Object.assign({}, rightCursor))
		drawBottom(w, H, Y_TILE_OFF, Object.assign({}, rightCursor))
	}

	// setTimeout(() => {
	// 	ctx.moveTo(W/2, 0)
	// 	ctx.lineTo(W/2, H)
	// 	ctx.stroke()
	//
	// 	ctx.moveTo(0, H/2)
	// 	ctx.lineTo(W, H/2)
	// 	ctx.stroke()
	// }, 300)
}

/**
 * @param {number} W
 * @param {number} H 
 * @param {number} yOff
 * @param {Coord} cursor
 */
function drawTop(W, H, yOff, cursor) {
	for (let i = yOff; i < H + yOff; i += TILE_SIZE) {
		cursor.y -= 1
		getTileData(cursor, (image) => {
			ctx.drawImage(image, W, H/2 - i - TILE_SIZE)
		})
	}
}

/**
 * @param {number} W
 * @param {number} H 
 * @param {number} yOff
 * @param {Coord} cursor
 */
function drawBottom(W, H, yOff, cursor) {
	for (let i = TILE_SIZE - yOff; i < H + yOff; i += TILE_SIZE) {
		cursor.y += 1
		getTileData(cursor, (image) => {
			ctx.drawImage(image, W, H/2 + i)
		})
	}
}


/**
 * @param {Coord} coord 
 * @param {(image: HTMLImageElement) => void} callback
 */
function getTileData({ x, y, z }, callback) {
	const image = new Image()
	// Cache-Control: max-age=31536000
	image.onload = () => callback(image)
	image.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
}

render()


const drag = {
	drag: false,
	x: 0,
	y: 0
}

canvas.addEventListener("mousedown", (e) => {
	drag.drag = true
	drag.x = e.clientX
	drag.y = e.clientY
})

canvas.addEventListener("mousemove", (e) => {
	if (!drag.drag) return
	const diffX = e.clientX - drag.x
	const diffY = e.clientY - drag.y

	canvas.style.transform=`translate(${diffX}px, ${diffY}px)`
})

canvas.addEventListener("mouseup", (e) => {
	if (!drag.drag || (drag.x === e.clientX && drag.y === e.clientY)) return

	const xCoordShift = 360/(Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE) * (drag.x - e.clientX)
	const yCoordShift = 180/(Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE) * (e.clientY - drag.y)

	DEFAULT_COORDS.x += xCoordShift
	DEFAULT_COORDS.y += yCoordShift

	render()

	drag.drag = false
	drag.x = 0
	drag.y = 0
	canvas.style.transform = ""
})

canvas.addEventListener("mouseout", (e) => {
	if (!drag.drag) return

	const xCoordShift = 360/(Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE) * (drag.x - e.clientX)
	const yCoordShift = 180/(Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE) * (e.clientY - drag.y)

	DEFAULT_COORDS.x += xCoordShift
	DEFAULT_COORDS.y += yCoordShift

	render()

	drag.drag = false
	drag.x = 0
	drag.y = 0
	canvas.style.transform = ""
})
