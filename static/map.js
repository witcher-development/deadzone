navigator.serviceWorker.getRegistrations().then(function(registrations) {
 for(let registration of registrations) {
  registration.unregister()
} })
function registerServiceWorker () {
	navigator.serviceWorker.register('static/sw.js', { scope: './' })
};
registerServiceWorker()

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

const DEBUG = true
const TILE_SIZE = 256

/**
 * @param {Coord} coord 
 * @returns {Coord}
 */
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

/**
 * @param {number} W
 * @param {number} H 
 * @param {number} xOff
 * @param {number} yOff
 */
function debugGrid(W, H, xOff, yOff) {
	ctx.strokeStyle = "#000"

	const firstX = W/2 - xOff
	const firstY = H/2 - yOff

	const xOffFromScreenCorner = firstX % TILE_SIZE
	const yOffFromScreenCorner = firstY % TILE_SIZE

	// draw long
	for (let x = xOffFromScreenCorner; x < W; x += TILE_SIZE) {
		ctx.moveTo(x, 0)
		ctx.lineTo(x, H)
		ctx.stroke()
	}

	// draw lat
	for (let y = yOffFromScreenCorner; y < H; y += TILE_SIZE) {
		ctx.moveTo(0, y)
		ctx.lineTo(W, y)
		ctx.stroke()
	}
}

const canvas = /** @type HTMLCanvasElement */ (document.querySelector("#map"))
const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext("2d"))

function render() {
	const W = document.body.clientWidth * 2
	const H = document.body.clientHeight * 2
	canvas.width = W
	canvas.height = H
	// ctx.fillStyle = "#000"
	// ctx.fillRect(0, 0, W, H)

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
	if (DEBUG) {
		setTimeout(() => {
			debugGrid(W, H, X_TILE_OFF, Y_TILE_OFF)
		}, 2000)
	}

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


/** @type Cache */
let cache

/**
 * @param {Coord} coord 
 * @param {(image: HTMLImageElement | ImageBitmap) => void} callback
 */
async function getTileData({ x, y, z }, callback) {
	if (!cache) {
		cache = await caches.open("tiles")
	}

	const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
	const match = await cache.match(url)
	if (match) {
		console.log('hit')
		const blob = await match.blob()
		const bitmap = await window.createImageBitmap(blob)
		callback(bitmap)
	} else {
		console.log('miss')
		const image = new Image()
		image.onload = () => callback(image)
		image.src = url
	}
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

	const dx = drag.x - e.clientX
	const dy = e.clientY - drag.y

	const xCoordShift = 360/(Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE) * dx

	const firstTile = latLonToTile(DEFAULT_COORDS)
	const currentYinPix = firstTile.y * TILE_SIZE + firstTile.yTileOff
	const newYinPix = currentYinPix - dy

	const d = 180 / Math.PI
	const latRad = Math.PI * (1 - 2 * newYinPix / (Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE));
	const yNew = (2 * Math.atan(Math.exp(latRad)) - Math.PI / 2) * d;

	DEFAULT_COORDS.x += xCoordShift
	DEFAULT_COORDS.y = yNew

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

// fetch("/")
