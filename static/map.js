/**
 * @typedef {Object} Coord
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/** @type Coord */
const DEFAULT_COORDS = {
	x: 48.1435711,
	y: 17.1250631,
	z: 19
}

// https://tile.openstreetmap.org/{z}/{x}/{y}.png
/**
 * @param {number} lat 
 * @param {number} lon
 * @param {number} zoom 
 */
function latLonToTile(lat, lon, zoom) {
  const latRad = lat * Math.PI / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
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

	getTileData(DEFAULT_COORDS, (image) => {
		ctx.drawImage(image, W/2, H/2)
	})
}

render()


/**
 * @param {Coord} coord 
 * @param {(image: HTMLImageElement) => void} callback
 */
function getTileData({ x, y, z }, callback) {
	const image = new Image()
	image.onload = () => callback(image)
	const coords = latLonToTile(x, y, z)
	image.src = `https://tile.openstreetmap.org/${z}/${coords.x}/${coords.y}.png`
}
