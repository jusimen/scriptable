// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: credit-card;

const settings = Object.freeze({
	colors: {
		blue: {
			100: Color.dynamic(new Color('#0096ff '), new Color('#0096ff')),
			200: Color.dynamic(new Color('#27529a'), new Color('#27529a')),
			300: Color.dynamic(new Color('#d1ebfd '), new Color('#002350')),
		},
		green: {
			100: Color.dynamic(new Color('#00af3c'), new Color('#00af3c')),
			200: Color.dynamic(new Color('#11690b'), new Color('#11690b')),
			300: Color.dynamic(new Color('#c4f6d5 '), new Color('#23321e')),
		},
		orange: {
			100: Color.dynamic(new Color('#ff5f14'), new Color('#ff5f14')),
			200: Color.dynamic(new Color('#9a6e0c'), new Color('#9a6e0c')),
			300: Color.dynamic(new Color('#f9d9cb '), new Color('#3e3a0b')),
		},
		text: {
			300: Color.dynamic(new Color('#3a3a3a'), new Color('#fff')),
			200: Color.dynamic(new Color(' #3a3a3a '), new Color('#adadb0')),
		},
		background: {
			100: Color.dynamic(new Color('#fff'), new Color('#1c1c1c')),
			200: Color.dynamic(new Color('#e1e1e1'), new Color('#292828 ')),
		},
	},
	font: {
		title: Font.semiboldSystemFont(36),
		subtitle: Font.systemFont(16),
		text: Font.systemFont(12),
	},
	resources: {
		validations:
			'https://api.carrismetropolitana.pt/v2/metrics/videowall/delays',
	},
});

// Widget
const widget = new ListWidget();
widget.backgroundColor = settings.colors.background[100];
widget.url = 'scriptable:///run/CMET%20-%20Validations%20All-in-one';

// Fetches Data
async function fetchData(url) {
	const req = new Request(url);
	const res = await req.loadJSON();
	return res;
}

const normalizeTimestamp = (timestamp) => {
	return `Atualizado às ${new Date(timestamp).toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
	})}`;
};

function Card({
	sentiment,
	title,
	valuePrimary,
	valueSecondary,
	parentStack = widget,
	size = new Size(330 / 2, 70),
}) {
	const sentimentColor =
		sentiment === 'good'
			? settings.colors.green
			: sentiment === 'normal'
			? settings.colors.blue
			: settings.colors.orange;

	//
	const stack = parentStack.addStack();
	stack.size = size;
	stack.cornerRadius = 20;
	stack.borderWidth = 5;
	stack.borderColor = sentimentColor[100];
	stack.backgroundColor = sentimentColor[300];
	const padding = 15;
	stack.setPadding(padding, padding, padding, padding);
	stack.layoutVertically();

	// Title
	const titleText = stack.addText(title);
	titleText.font = settings.font.subtitle;
	titleText.textColor = settings.colors.text[100];

	stack.addSpacer(10);

	// Value Primary
	const horizontalStack = stack.addStack();
	size.width >= 100
		? horizontalStack.layoutHorizontally()
		: horizontalStack.layoutVertically();
	horizontalStack.bottomAlignContent();

	const valuePrimaryText = horizontalStack.addText(valuePrimary);
	valuePrimaryText.font = settings.font.title;
	valuePrimaryText.textColor = sentimentColor[100];

	// Value Secondary
	const valueSecondaryStack = horizontalStack.addStack();
	valueSecondaryStack.layoutVertically();
	valueSecondaryStack.bottomAlignContent();
	size.width >= 100
		? valueSecondaryStack.setPadding(0, 5, 0, 0)
		: valueSecondaryStack.setPadding(0, 0, 0, 5);

	const valueSecondaryText = valueSecondaryStack.addText(valueSecondary);
	valueSecondaryText.font = settings.font.subtitle;
	valueSecondaryText.textColor = sentimentColor[200];
}

async function main() {
	//

	//
	// A. Fetch data
	const validationsData = await fetchData(settings.resources.validations);

	//
	// B. Transform data

	const types = ['cm', '41', '42', '43', '44'];

	const validationsParsed = types.map((type) => {
		return {
			primary_value:
				validationsData.data[
					`_${type}_delayed_for_more_than_five_minutes_count`
				] / validationsData.data[`_${type}_total_until_now_count`],
			primary_value_string: `${Intl.NumberFormat('pt-PT', {
				maximumFractionDigits: 0,
			}).format(
				(validationsData.data[
					`_${type}_delayed_for_more_than_five_minutes_count`
				] /
					validationsData.data[`_${type}_total_until_now_count`]) *
					100
			)}%`,
			secondary_value:
				validationsData.data[
					`_${type}_delayed_for_more_than_five_minutes_count`
				],
			secondary_value_string: `(${Intl.NumberFormat('pt-PT').format(
				validationsData.data[
					`_${type}_delayed_for_more_than_five_minutes_count`
				]
			)})`,
		};
	});

	//
	// C. Render
	widget.spacing = 10;

	// Carris Metropolitana
	Card({
		sentiment: validationsParsed[0].primary_value > 0.095 ? 'bad' : 'good',
		timestamp: validationsData?.timestamp_resource,
		size: new Size(322, 90),
		title: `⏱️ CM - Viagens atrasadas > 5 min`,
		valuePrimary: validationsParsed[0].primary_value_string,
		valueSecondary: validationsParsed[0].secondary_value_string,
	});

	// Areas 1 & 2
	const horizontalStack = widget.addStack();
	horizontalStack.layoutHorizontally();
	horizontalStack.bottomAlignContent();
	horizontalStack.spacing = 10;

	validationsParsed.slice(1, 3).forEach((validation, index) => {
		Card({
			sentiment: validation.primary_value > 0.095 ? 'bad' : 'good',
			timestamp: validationsData?.timestamp_resource,
			size: new Size(310 / 2, 90),
			title: `⏱️ Area ${types[index + 1].substring(1)}`,
			valuePrimary: validation.primary_value_string,
			valueSecondary: validation.secondary_value_string,
			parentStack: horizontalStack,
		});
	});

	// Areas 3 & 4
	const horizontalStack2 = widget.addStack();
	horizontalStack2.layoutHorizontally();
	horizontalStack2.bottomAlignContent();
	horizontalStack2.spacing = 10;

	validationsParsed.slice(3, 5).forEach((validation, index) => {
		Card({
			sentiment: validation.primary_value > 0.095 ? 'bad' : 'good',
			timestamp: validationsData?.timestamp_resource,
			size: new Size(310 / 2, 90),
			title: `⏱️ Area ${types[index + 3].substring(1)}`,
			valuePrimary: validation.primary_value_string,
			valueSecondary: validation.secondary_value_string,
			parentStack: horizontalStack2,
		});
	});

	//
	// D. Add Spacer

	//
	// E. Add Footer
	const footerStack = widget.addStack();
	footerStack.layoutHorizontally();
	footerStack.bottomAlignContent();
	footerStack.setPadding(0, 10, 0, 0);

	const updatedAtText = footerStack.addText(
		normalizeTimestamp(validationsData?.timestamp_resource)
	);
	updatedAtText.font = settings.font.subtitle;
	updatedAtText.textColor = settings.colors.text[200];
}

// MAIN

await main();

Script.setWidget(widget);
Script.complete();
widget.presentLarge();
