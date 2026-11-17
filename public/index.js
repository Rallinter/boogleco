"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("sj-error-code");

let controller = null;

async function getController() {
	if (controller) return controller;

	const registration =
		(await registerSW()) || (await navigator.serviceWorker.ready);

	if (!navigator.serviceWorker.controller) {
		await new Promise((resolve) =>
			navigator.serviceWorker.addEventListener("controllerchange", resolve, {
				once: true,
			})
		);
	}

	const { Controller } = $scramjetController;
	const { default: LibcurlClient } = await import("/libcurl/index.mjs");

	const wispUrl =
		(location.protocol === "https:" ? "wss" : "ws") +
		"://" +
		location.host +
		"/wisp/";

	controller = new Controller({
		serviceworker: registration,
		transport: new LibcurlClient({ wisp: wispUrl }),
		config: {
			scramjetPath: "/scram/scramjet.js",
			wasmPath: "/scram/scramjet.wasm",
			injectPath: "/controller/controller.inject.js",
		},
	});

	await controller.wait();
	return controller;
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	let sjController;
	try {
		sjController = await getController();
	} catch (err) {
		error.textContent = "Failed to initialize Scramjet 2.0.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);

	const iframe = document.createElement("iframe");
	iframe.id = "sj-frame";
	document.body.appendChild(iframe);

	const frame = sjController.createFrame(iframe);
	frame.go(url);
});
