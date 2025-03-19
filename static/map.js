/**
 * @typedef {Object} Coord
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/** @type Coord */
const DEFAULT_COORDS = {
	x: 17.1250631,
	y: 48.1435711,
	z: 15
}

// https://tile.openstreetmap.org/{z}/{x}/{y}.png
/**
 * @param {Coord} coord 
 */
// TODO: handle biggest zooms
function latLonToTile({ x, y, z }) {
  const latRad = y * Math.PI / 180;
  const n = Math.pow(2, z);
  const x1 = Math.floor((x + 180) / 360 * n);
  const y1 = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x: x1, y: y1, z };
}

const canvas = /** @type HTMLCanvasElement */ (document.querySelector("#map"))
const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext("2d"))

function render() {
	const W = document.body.clientWidth
	const H = document.body.clientHeight
	canvas.width = W
	canvas.height = H
	ctx.fillStyle = "#000"
	ctx.fillRect(0, 0, W, H)

	const firstTile = latLonToTile(DEFAULT_COORDS)
	getTileData(firstTile, (image) => {
		ctx.drawImage(image, W/2 - 128, H/2 - 128)
	})
	drawTop(W/2 - 128, H, Object.assign({}, firstTile))
	drawBottom(W/2 - 128, H, Object.assign({}, firstTile))

	const leftCursor = Object.assign({}, firstTile)
	// move left
	for (let i = 128; i < W / 2 + 128; i += 256) {
		leftCursor.x -= 1
		const w = W/2 - i - 256
		getTileData(leftCursor, (image) => {
			ctx.drawImage(image, w, H/2 - 128)
		})
		drawTop(w, H, Object.assign({}, leftCursor))
		drawBottom(w, H, Object.assign({}, leftCursor))
	}

	const rightCursor = Object.assign({}, firstTile)
	// move right
	for (let i = 128; i < W / 2 + 128; i += 256) {
		rightCursor.x += 1
		const w = W/2 + i
		getTileData(rightCursor, (image) => {
			ctx.drawImage(image, w, H/2 - 128)
		})
		drawTop(w, H, Object.assign({}, rightCursor))
		drawBottom(w, H, Object.assign({}, rightCursor))
	}
}

render()


/**
 * @param {number} W
 * @param {number} H 
 * @param {Coord} cursor
 */
function drawTop(W, H, cursor) {
	for (let i = 128; i < H / 2 + 128; i += 256) {
		cursor.y -= 1
		getTileData(cursor, (image) => {
			ctx.drawImage(image, W, H/2 - i - 256)
		})
	}
}

/**
 * @param {number} W
 * @param {number} H 
 * @param {Coord} cursor
 */
function drawBottom(W, H, cursor) {
	for (let i = 128; i < H / 2 + 128; i += 256) {
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
	image.onload = () => callback(image)
	image.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
}
