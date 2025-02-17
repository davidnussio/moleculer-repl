"use strict";

const kleur 							= require("kleur");
const _ 								= require("lodash");
const { table, getBorderCharacters } 	= require("table");

function labelsToStr(labels) {
	const keys = Object.keys(labels);
	if (keys.length == 0)
		return kleur.gray("{}");

	return kleur.gray("{") + keys.map(key => `${kleur.gray(key)}: ${kleur.magenta("" + labels[key])}`).join(", ") + kleur.gray("}");
}

module.exports = function(vorpal, broker) {
	// List actions
	vorpal
		.removeIfExist("metrics")
		.command("metrics", "List metrics")
		.option("-f, --filter <match>", "filter metrics (e.g.: 'moleculer.**')")
		.action((args, done) => {
			if (!broker.isMetricsEnabled())
				return console.error(kleur.red().bold("Metrics feature is disabled."));

			const snapshot = broker.metrics.list({ includes: args.options.filter });

			const getMetricValue = function(metric, item) {
				if (metric.type == "histogram") {
					// Histogram
					return ["min", "mean", "max"].map(key => `${kleur.gray(key)}: ${kleur.green().bold("" + Number(item[key]).toFixed(2))}`).join(", ");
				}
				if (_.isString(item.value))
					return kleur.yellow().bold(`"${item.value}"`);
				return kleur.green().bold(item.value);
			};

			const data = [
				[
					kleur.bold("Name"),
					kleur.bold("Type"),
					kleur.bold("Labels"),
					kleur.bold("Value")
				]
			];

			let hLines = [];

			snapshot.sort((a, b) => a.name.localeCompare(b.name));

			snapshot.forEach(metric => {
				if (metric.values.size == 0) {
					data.push([
						metric.name,
						metric.type,
						"-",
						kleur.gray("<no values>")
					]);
					return;
				}

				metric.values.forEach(item => {
					const labelStr = labelsToStr(item.labels);
					data.push([
						metric.name,
						metric.type,
						labelStr,
						getMetricValue(metric, item)
					]);
				});
				hLines.push(data.length);
			});

			const tableConf = {
				border: _.mapValues(getBorderCharacters("honeywell"), char => kleur.gray(char)),
				columns: {
				},
				drawHorizontalLine: (index, count) => index == 0 || index == 1 || index == count || hLines.indexOf(index) !== -1
			};

			console.log(table(data, tableConf));

			done();
		});
};
