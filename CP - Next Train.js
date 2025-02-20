// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: subway;

/**
 * Represents a train object.
 *
 * @typedef {Object} Train
 * @property {number|null} delay - The delay in minutes.
 * @property {Object} trainOrigin - The origin of the train.
 * @property {string} trainOrigin.code - The code of the origin station.
 * @property {string} trainOrigin.designation - The designation of the origin station.
 * @property {Object} trainDestination - The destination of the train.
 * @property {string} trainDestination.code - The code of the destination station.
 * @property {string} trainDestination.designation - The designation of the destination station.
 * @property {string} departureTime - The departure time of the train.
 * @property {string} arrivalTime - The arrival time of the train.
 * @property {number} trainNumber - The number of the train.
 * @property {Object} trainService - The service of the train.
 * @property {string} trainService.code - The code of the train service.
 * @property {string} trainService.designation - The designation of the train service.
 * @property {string} platform - The platform number.
 * @property {number|null} occupancy - The occupancy status.
 * @property {string} eta - The estimated time of arrival.
 * @property {string} etd - The estimated time of departure.
 */
class Train {
	constructor(data) {
		this.delay = data.delay;
		this.trainOrigin = {
			code: data.trainOrigin.code,
			designation: data.trainOrigin.designation,
		};
		this.trainDestination = {
			code: data.trainDestination.code,
			designation: data.trainDestination.designation,
		};
		this.departureTime = data.departureTime;
		this.arrivalTime = data.arrivalTime;
		this.trainNumber = data.trainNumber;
		this.trainService = {
			code: data.trainService.code,
			designation: data.trainService.designation,
		};
		this.platform = data.platform;
		this.occupancy = data.occupancy;
		this.eta = data.eta;
		this.etd = data.etd;
	}
}

/**
 * Represents a station object.
 *
 * @typedef {Object} Station
 * @property {string} id - The ID of the station.
 * @property {string} name - The name of the station.
 */
class Station {
	constructor(data) {
		this.id = data.id;
		this.name = data.name.replace(/\b[\w'-]/g, (char) =>
			char.toUpperCase()
		);
	}
}

const stationId = args.widgetParameter;

// Colors
const primaryColor = Color.dynamic(new Color('#608f3d'), new Color('#bdd298'));
const backgroundColor = Color.dynamic(new Color('#fff'), new Color('#1C1C1E'));
const textColor = Color.dynamic(new Color('#1C1C1E'), new Color('#fff'));
const secondaryColor = Color.dynamic(
	new Color('#608f3d'),
	new Color('#bdd298')
);
const delayColor = Color.dynamic(new Color('#D22E2E'), new Color('#fd8c8c'));
// Widget
const widget = new ListWidget();
const padding = 20;
widget.backgroundColor = backgroundColor;
widget.textColor = textColor;

// URL
stationId &&
	(widget.url =
		'https://www.cp.pt/passageiros/pt/consultar-horarios/proximos-comboios');

/**
 * Fetches the next trains for a given station.
 *
 * @param {string} stationId - The ID of the station to fetch trains for.
 * @returns {Promise<Array<Train>>} A promise that resolves to an array of train objects.
 */
async function getTrains(stationId) {
	const url = `https://www.cp.pt/sites/spring/station/trains?stationId=${stationId}`;
	const req = new Request(url);
	const res = await req.loadJSON();
	return res.map((train) => new Train(train));
}

/**
 * Fetches the stations for a given station.
 *
 * @param {string} stationId - The ID of the station to fetch stations for.
 * @returns {Promise<Array<Station>>} A promise that resolves to an array of station objects.
 */
async function getStations() {
	const url = `https://www.cp.pt/sites/spring/station-index`;
	const req = new Request(url);
	const res = await req.loadJSON();
	return Object.entries(res).map(([name, id]) => new Station({ name, id }));
}
/**
 * Renders Widget
 */
async function renderWidget(stationId) {
	//
	// Load Data
	const trains = await getTrains(stationId);
	const station = (await getStations()).find((s) => s.id === stationId);

	//
	// Render Header
	const headerStack = widget.addStack();
	headerStack.layoutHorizontally();
	headerStack.centerAlignContent();

	const headerTextStack = headerStack.addStack();
	headerTextStack.layoutVertically();

	const headerText = headerTextStack.addText('PROXIMOS COMBOIOS');
	headerText.font = Font.mediumSystemFont(16);
	headerText.textColor = primaryColor;

	const headerSubText = headerTextStack.addText(`${station.name}`);
	headerSubText.font = Font.systemFont(12);
	headerSubText.textColor = textColor;
	headerSubText.textOpacity = 0.75;

	headerStack.addSpacer();

	await renderImage(
		'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Logo_CP_2.svg/320px-Logo_CP_2.svg.png',
		headerStack
	);

	renderHLine(primaryColor);

	const tableStack = widget.addStack();
	tableStack.layoutVertically();

	//
	// Render Trains
	renderHeader(tableStack);
	renderHLine(new Color(textColor.hex, 0.5), tableStack);
	trains.slice(0, 3).forEach((train) => renderRow(train, tableStack));
}

function renderHeader(tableStack) {
	const headerStack = tableStack.addStack();
	headerStack.layoutHorizontally();

	const destination = headerStack.addText('DESTINO');
	destination.font = Font.semiboldSystemFont(11);
	destination.textColor = textColor;
	destination.textOpacity = 0.75;

	headerStack.addSpacer();

	const departureTime = headerStack.addText('HORA');
	departureTime.font = Font.semiboldSystemFont(11);
	departureTime.textColor = textColor;
	departureTime.textOpacity = 0.75;
}
/**
 * Renders Line
 * @param {Train} train
 */
function renderRow(train, parentStack) {
	const rowStack = parentStack.addStack();
	rowStack.layoutHorizontally();
	rowStack.setPadding(0, 0, 5, 0);

	// Destination
	const destination = rowStack.addText(train.trainDestination.designation);
	destination.font = Font.systemFont(14);
	destination.textColor = textColor;

	rowStack.addSpacer();

	// Departure Time
	const departureTimeStack = rowStack.addStack();
	departureTimeStack.layoutHorizontally();

	const departureTime = departureTimeStack.addText(
		train.delay ? train.etd : train.departureTime
	);
	departureTime.font = Font.boldSystemFont(14);
	departureTime.textColor = primaryColor;

	const delay = departureTimeStack.addText(
		train.delay ? `  (+${train.delay}m)` : ''
	);
	delay.font = Font.systemFont(12);
	delay.textColor = delayColor;
}

function renderHLine(color = textColor, w = widget) {
	w.addSpacer(5);

	const hline = w.addStack();
	hline.size = new Size(0, 1);
	hline.backgroundColor = color;
	hline.addSpacer();

	w.addSpacer(5);
}

async function renderImage(imageUrl, parentStack = widget) {
	const req = new Request(imageUrl);
	const image = await req.loadImage();

	const imageNode = parentStack.addImage(image);
	imageNode.imageSize = new Size(20, 20);
	imageNode.leftAlignImage();
}

if (!stationId) {
	const stations = (await getStations()).sort((a, b) =>
		a.name.localeCompare(b.name)
	);
	const table = new UITable();

	for (const station of stations) {
		const row = new UITableRow();
		row.addText(station.name);
		row.addText(station.id);
		row.onSelect = async () => {
			Pasteboard.copy(station.id);

			const alert = new Alert();
			alert.title = 'ID Copied to Clipboard';
			alert.message = 'You can now paste it into the widget';
			alert.addAction('OK');
			await alert.present();

			Script.complete();
		};
		table.addRow(row);
	}

	await table.present();
	return;
}

await renderWidget(stationId);

Script.setWidget(widget);
Script.complete();
widget.presentMedium();
