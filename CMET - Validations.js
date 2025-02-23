// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: credit-card;

const settings = Object.freeze({
	colors: {
		blue: {
			100: Color.dynamic(new Color('#0096ff'), new Color('#0096ff')),
			200: Color.dynamic(new Color('#27529a'), new Color('#27529a')),
			300: Color.dynamic(new Color('#002350'), new Color('#002350')),
		},
		green: {
			100: Color.dynamic(new Color('#00af3c'), new Color('#00af3c')),
			200: Color.dynamic(new Color('#11690b'), new Color('#11690b')),
			300: Color.dynamic(new Color('#23321e'), new Color('#23321e')),
		},
		orange: {
			100: Color.dynamic(new Color('#ff5f14'), new Color('#ff5f14')),
			200: Color.dynamic(new Color('#9a6e0c'), new Color('#9a6e0c')),
			300: Color.dynamic(new Color('#3e3a0b'), new Color('#3e3a0b')),
		},
		text: {
			300: Color.dynamic(new Color('#000'), new Color('#fff')),
			200: Color.dynamic(new Color(' #3a3a3a '), new Color('#adadb0')),
		},
		background: {
			100: Color.dynamic(new Color('#fff'), new Color('#1c1c1c')),
			200: Color.dynamic(new Color('#e1e1e1'), new Color('#292828 ')),
		},
	},
	font: {
		title: Font.semiboldSystemFont(48),
		subtitle: Font.systemFont(22),
		text: Font.systemFont(16),
	},
	resources: {
		validations:
			'https://api.carrismetropolitana.pt/v2/metrics/videowall/validations',
	},
});

// Widget
const widget = new ListWidget();
widget.backgroundColor = settings.colors.background[100];

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
	timestamp,
	subtitle,
	valuePrimary,
	valueSecondary,
	parentStack = widget,
}) {
	const sentimentColor =
		sentiment === 'good'
			? settings.colors.green
			: sentiment === 'normal'
			? settings.colors.blue
			: settings.colors.orange;

	//
	const stack = parentStack.addStack();
	stack.size = new Size(330, 155);
	stack.cornerRadius = 20;
	stack.borderWidth = 10;
	stack.borderColor = sentimentColor[100];
	stack.backgroundColor = sentimentColor[300];
	const padding = 15;
	stack.setPadding(padding, padding, padding, padding);
	stack.layoutVertically();

	// Title
	const titleText = stack.addText(title);
	titleText.font = settings.font.subtitle;
	titleText.textColor = settings.colors.text[100];

	// Subtitle
	const subtitleText = stack.addText(subtitle);
	subtitleText.font = settings.font.text;
	subtitleText.textColor = settings.colors.text[200];

	// Value Primary
	const horizontalStack = stack.addStack();
	horizontalStack.layoutHorizontally();
	horizontalStack.bottomAlignContent();

	const valuePrimaryText = horizontalStack.addText(valuePrimary);
	valuePrimaryText.font = settings.font.title;
	valuePrimaryText.textColor = sentimentColor[100];

	// Value Secondary
	const valueSecondaryStack = horizontalStack.addStack();
	valueSecondaryStack.setPadding(0, 5, 5, 0);

	const valueSecondaryText = valueSecondaryStack.addText(valueSecondary);
	valueSecondaryText.font = settings.font.subtitle;
	valueSecondaryText.textColor = sentimentColor[200];

	stack.addSpacer();

	const updatedAtText = stack.addText(normalizeTimestamp(timestamp));
	updatedAtText.font = settings.font.text;
	updatedAtText.textColor = sentimentColor[200];
}

async function main() {
	//

	//
	// A. Fetch data
	const validationsData = await fetchData(settings.resources.validations);
	const type = (args.widgetParameter ?? 'CM').toLowerCase();

	//
	// B. Transform data

	try {
		const validationsParsed = {
			primary_value: validationsData.data[`_${type}_today_valid_count`],
			primary_value_string:
				validationsData.data[
					`_${type}_today_valid_count`
				].toLocaleString(),
			secondary_value:
				validationsData.data[`_${type}_today_valid_count`] /
				validationsData.data[`_${type}_last_week_valid_count`],
			secondary_value_string: `${parseFloat(
				(
					(validationsData.data[`_${type}_today_valid_count`] * 100) /
					validationsData.data[`_${type}_last_week_valid_count`]
				).toFixed(2)
			)}%`,
		};

		//
		// C. Render
		Card({
			sentiment:
				validationsParsed.secondary_value < 1 ? 'normal' : 'good',
			timestamp: validationsData?.timestamp_resource,
			title:
				type === 'cm'
					? `💳 Carris Metropolitana`
					: `💳 Area ${type.substring(1)}`,
			subtitle: `Passageiros transportados hoje, até agora`,
			valuePrimary: validationsParsed.primary_value_string,
			valueSecondary: validationsParsed.secondary_value_string,
		});
	} catch (error) {
		Card({
			sentiment: 'bad',
			timestamp: validationsData?.timestamp_resource,
			title: `O argumento "${type}" não é válido.`,
			subtitle: '',
			valuePrimary: 'ERRO',
			valueSecondary: '',
		});
		return;
	}
}

// MAIN

await main();

Script.setWidget(widget);
Script.complete();
widget.presentMedium();
