/**
 * @typedef {Object} Coord
 * @property {number} x
 * @property {number} xTileOff
 * @property {number} y
 * @property {number} yTileOff
 * @property {number} z
 *
 * @typedef {[number, number][]} Zone
 *
 * @typedef {
 	{ editing: false }
 	| {
		editing: true,
		polygon: Zone,
	  }
  } EditingState
 */

const DEBUG = false
const TILE_SIZE = 256

const MOUSE = {
	x: 0,
	y: 0
}

/** @type Coord */
const DEFAULT_COORDS = {
	x: 17.1250631,
	xTileOff: 0,
	y: 48.1435711,
	yTileOff: 0,
	z: 15
}

/** @type EditingState */
let EDITING_STATE = {
	editing: false,
}

const DRAG_STATE = {
	drag: false,
	x: 0,
	y: 0
}

/** @type Map<string, ImageBitmap> */
const cache = new Map()

const canvas = /** @type HTMLCanvasElement */ (document.querySelector("#map"))
const ctx = /** @type CanvasRenderingContext2D */ (canvas.getContext("2d"))
const canvasEditing = /** @type HTMLCanvasElement */ (document.querySelector("#editing"))
const ctxEditing = /** @type CanvasRenderingContext2D */ (canvasEditing.getContext("2d"))

function render() {
	const W = document.body.clientWidth * 2
	const H = document.body.clientHeight * 2
	canvas.width = W
	canvas.height = H

	const firstTile = geoToTile(DEFAULT_COORDS)
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

/**
 * @param {Zone} zone
 * @param {CanvasRenderingContext2D} canvas
 * @param {number} W
 * @param {number} H
 */
function drawZone(zone, canvas, W, H) {
	zone.forEach(([x, y], i) => {
		const point = geoToPix(x, y)
		if (i === 0) {
			canvas.moveTo(point.x + W/2, point.y + H/2)
			return
		}
		canvas.lineTo(point.x + W/2, point.y + H/2)
		canvas.stroke()
	})
}

render()

document.addEventListener("mousemove", (e) => {
	MOUSE.x = e.clientX
	MOUSE.y = e.clientY
})

canvas.addEventListener("mousedown", (e) => {
	if (EDITING_STATE.editing) return
	DRAG_STATE.drag = true
	DRAG_STATE.x = e.clientX
	DRAG_STATE.y = e.clientY
})

canvas.addEventListener("mousemove", (e) => {
	if (!DRAG_STATE.drag) return
	const diffX = e.clientX - DRAG_STATE.x
	const diffY = e.clientY - DRAG_STATE.y

	canvas.style.transform=`translate(${diffX}px, ${diffY}px)`
})

canvas.addEventListener("mouseup", (e) => {
	if (!DRAG_STATE.drag || (DRAG_STATE.x === e.clientX && DRAG_STATE.y === e.clientY)) return

	const dx = DRAG_STATE.x - e.clientX
	const dy = e.clientY - DRAG_STATE.y

	const xCoordShift = 360/(Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE) * dx

	const firstTile = geoToTile(DEFAULT_COORDS)
	const currentYinPix = firstTile.y * TILE_SIZE + firstTile.yTileOff
	const newYinPix = currentYinPix - dy

	const d = 180 / Math.PI
	const latRad = Math.PI * (1 - 2 * newYinPix / (Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE));
	const yNew = (2 * Math.atan(Math.exp(latRad)) - Math.PI / 2) * d;

	DEFAULT_COORDS.x += xCoordShift
	DEFAULT_COORDS.y = yNew

	render()

	DRAG_STATE.drag = false
	DRAG_STATE.x = 0
	DRAG_STATE.y = 0
	canvas.style.transform = ""
})

canvas.addEventListener("mouseout", (e) => {
	if (!DRAG_STATE.drag) return

	const xCoordShift = 360/(Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE) * (DRAG_STATE.x - e.clientX)
	const yCoordShift = 180/(Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE) * (e.clientY - DRAG_STATE.y)

	DEFAULT_COORDS.x += xCoordShift
	DEFAULT_COORDS.y += yCoordShift

	render()

	DRAG_STATE.drag = false
	DRAG_STATE.x = 0
	DRAG_STATE.y = 0
	canvas.style.transform = ""
})

canvas.addEventListener("wheel", debounce((e) => {
	if (e.deltaY > 0 && DEFAULT_COORDS.z > 13) {
		DEFAULT_COORDS.z -= 1
		render()
	} else if (e.deltaY < 0 && DEFAULT_COORDS.z < 19) {
		DEFAULT_COORDS.z += 1
		render()
	}
}, 300))


document.querySelector("#edit").addEventListener('click', () => {
	if (EDITING_STATE.editing) {
		onEditingEnd()
	} else {
		// const storage = localStorage.getItem('zone')
		const storage = false
		EDITING_STATE = {
			editing: true,
			polygon: storage ? JSON.parse(storage) : []
		}
		canvasEditing.style.display = "block"
	}
})

document.querySelector("#clear")?.addEventListener('click', () => {
	localStorage.removeItem('zone')
})

canvasEditing.addEventListener('click', (e) => {
	if (!EDITING_STATE.editing) return

	const stickPoints = mouseNearFirstPoint()
	if (stickPoints) {
		EDITING_STATE.polygon.push(EDITING_STATE.polygon[0])
		const polygon = EDITING_STATE.polygon
		EDITING_STATE = { editing: false } 

		fetch("http://localhost:8080/zone", {
			method: "POST",
			body: JSON.stringify(polygon)
		})
	} else {
		const { x, y } = pixToGeo(e.clientX, e.clientY)
		EDITING_STATE.polygon.push([x, y])
	}

	localStorage.setItem('zone', JSON.stringify(EDITING_STATE.polygon))
})

canvasEditing.addEventListener("mousemove", () => {
	if (!EDITING_STATE.editing) throw new Error('shouldnt happen')

	renderEditing()
})

window.addEventListener('keydown', (e) => {
	if (EDITING_STATE.editing && e.ctrlKey && e.key === 'z') {
		EDITING_STATE.polygon.pop()
		renderEditing()
	}
	if (EDITING_STATE.editing && e.key === 'Escape') {
		onEditingEnd()
	}
});

function renderEditing() {
	if (!EDITING_STATE.editing) return

	const W = document.body.clientWidth
	const H = document.body.clientHeight
	canvasEditing.width = W
	canvasEditing.height = H

	ctxEditing.clearRect(0, 0, W, H)

	if (!EDITING_STATE.polygon.length) return

	ctxEditing.strokeStyle = "#000"

	drawZone(EDITING_STATE.polygon, ctxEditing, W, H)

	const stickPoints = mouseNearFirstPoint()
	if (stickPoints) {
		const first = EDITING_STATE.polygon[0]
		const firstPix = geoToPix(first[0], first[1])
		ctxEditing.lineTo(W/2 + firstPix.x, H/2 + firstPix.y)
		ctxEditing.stroke()
		return
	}
	ctxEditing.lineTo(MOUSE.x, MOUSE.y)
	ctxEditing.stroke()
}

/**
 * Assumes that map can't be zoomed or moved while editing
 */
function mouseNearFirstPoint() {
	if (!EDITING_STATE.editing) throw new Error('shouldnt happen')
	if (EDITING_STATE.polygon.length === 0) return
	const W = document.body.clientWidth
	const H = document.body.clientHeight

	const first = EDITING_STATE.polygon[0]
	const firstPix = geoToPix(first[0], first[1])

	const xDelta = Math.abs((W/2 + firstPix.x) - MOUSE.x)
	const yDelta = Math.abs((H/2 + firstPix.y) - MOUSE.y)

	return xDelta < 13 && yDelta < 13
}

function onEditingEnd() {
	EDITING_STATE = {
		editing: false,
	}
	canvasEditing.style.display = "none"
}

/**
 * @param {number} x
 * @param {number} y
 * @return {{ x: number, y: number }}
 */
function pixToGeo(x, y) {
	const W = document.body.clientWidth
	const H = document.body.clientHeight

	const firstTile = geoToTile(DEFAULT_COORDS)

	const centerX = W/2
	const centerY = H/2

	const dx = x - centerX
	const dy = centerY - y

	const xCoordShift = 360/(Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE) * dx

	const currentYinPix = firstTile.y * TILE_SIZE + firstTile.yTileOff
	const newYinPix = currentYinPix - dy

	const d = 180 / Math.PI
	const latRad = Math.PI * (1 - 2 * newYinPix / (Math.pow(2, DEFAULT_COORDS.z) * TILE_SIZE));
	const yNew = (2 * Math.atan(Math.exp(latRad)) - Math.PI / 2) * d;

	return {
		x: DEFAULT_COORDS.x + xCoordShift,
		y: yNew
	}
}

/**
 * Distance to current map center
 *
 * @param {number} x
 * @param {number} y
 * @return {{ x: number, y: number }}
 */
function geoToPix(x, y) {
	const geoDeltaX = x - DEFAULT_COORDS.x

	const n = Math.pow(2, DEFAULT_COORDS.z);
	const allPix = n * TILE_SIZE
	const coeffX = allPix / 360

	const xPix = coeffX * geoDeltaX

	const latRadCurrent = DEFAULT_COORDS.y * Math.PI / 180;
	const yCurrentCenterPix = (1 - Math.log(Math.tan(latRadCurrent) + 1 / Math.cos(latRadCurrent)) / Math.PI) / 2 * n * TILE_SIZE

	const latRadNew = y * Math.PI / 180;
	const yGivenPointPix = (1 - Math.log(Math.tan(latRadNew) + 1 / Math.cos(latRadNew)) / Math.PI) / 2 * n * TILE_SIZE

	const yPix = yGivenPointPix - yCurrentCenterPix

	return { x: xPix, y: yPix };
}

/**
 * @param {Coord} coord 
 * @returns {Coord}
 */
function geoToTile({ x, y, z }) {
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
 * @param {Coord} coord 
 * @param {(image: HTMLImageElement | ImageBitmap) => void} callback
 */
function getTileData({ x, y, z }, callback) {
	const key = `${x}-${y}-${z}`
	if (cache.has(key)) {
		callback(cache.get(key))
		return
	}
	fetch(`/tile/${z}/${x}/${y}`)
		.then(res => res.blob())
		.then(window.createImageBitmap)
		.then((bitmap) => {
			callback(bitmap)
			cache.set(key, bitmap)
		})
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

/**
 * @template {unknown[]} T
 * @param {(...args: T) => void} callback
 * @param {number} interval
 * @returns {(...args: T) => void}
 */
function debounce (callback, interval) {
	let canRun = true
	return function (...args) {
		if (!canRun) return
		canRun = false
		callback(...args)
		setTimeout(() => {
			canRun = true
		}, interval)
	}
}
