const sw = /** @type ServiceWorkerGlobalScope */ (self)

sw.addEventListener('install', () => {
  sw.skipWaiting();
});

sw.addEventListener('fetch', async function(event) {
	if (!event.request.url.includes("openstreetmap")) return
	console.log('intercept')
	const tileCache = await caches.open("tiles")
	await tileCache.add(event.request.url)
	event.respondWith(await tileCache.match(event.request.url))
	// console.log(event.request.url, event.request.url.includes("openstreetmap"))
	// if (!event.request.url.includes("openstreetmap")) return
	// console.log(event.request.headers.get("Cache-Control"))
	// event.respondWith(
	// 	(async () => {
	// 		const newHeaders = new Headers(event.request.headers);
	// 		newHeaders.set("Cache-Control", "max-age=31536000");
	//
	// 		const newRequest = new Request(event.request, {
	// 		  headers: newHeaders,
	// 		});
	//
	// 		console.log(newRequest.headers.get("Cache-Control"));
	// 		return fetch(newRequest)
	// 	})()
	// )
	
	// const headers = new Headers(event.request.headers)
	// headers.set("Cache-Control", "max-age=31536000")
	// const newRequest = new Request(event.request, {
	// 	desitnation: "image",
	// 	type: "cors",
	// 	headers: { ...event.request.headers, "Cache-Control": "max-age=31536000"},
	// });
	// console.log(newRequest)
	// event.respondWith(fetch(newRequest));
})
