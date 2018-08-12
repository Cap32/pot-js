import { logger } from 'pot-logger';
import createTable from '../utils/createTable';
import { isUndefined, isFunction, flatten } from 'lodash';
import Pot from '../core/Pot';
import logUpdate from 'log-update';
import chalk from 'chalk';
import { init } from '../cli/initializer';
import { list as schema } from '../Schemas/cli';

const paddingSpaces = '    ';

const defaultCells = [
	{ title: 'Name', width: 10, get: (state) => state.name },
	{
		title: 'Instance',
		width: 10,
		get: (state) => `#${state.monitor.instanceId || 0}`,
	},
	{
		title: 'Status',
		width: 8,
		get: (state, chalk) => {
			const { status } = state.monitor;
			switch (status) {
				case 'running':
					return chalk.green(status);
				case 'stopped':
				case 'crashed':
					return chalk.red(status);
				case 'sleeping':
					return chalk.yellow(status);
				default:
					return status;
			}
		},
	},
	{
		title: 'Crashes',
		width: 8,
		get: (state) => state.monitor.crashes,
	},
	{
		title: 'Memory',
		width: 18,
		get: (state) => {
			const { styled, value } = state.memoryUsage;
			const color = value < 20 ? 'reset' : value < 50 ? 'yellow' : 'red';
			return chalk[color](styled);
		},
	},
	{
		title: 'CPU',
		width: 6,
		get: (state) => {
			const { styled, value } = state.cpuUsage;
			const color = value < 40 ? 'reset' : value < 80 ? 'yellow' : 'red';
			return chalk[color](styled);
		},
	},
	{ title: 'Started', width: 20, get: (state) => state.monitor.startedLocal },
	{ title: 'PID', width: 6, get: (state) => state.pid },
];

const list = async function list(options = {}) {
	init(schema, options);

	const { cells: getCells = defaultCells } = options;
	const cells = isFunction(getCells) ? getCells(defaultCells) : getCells;

	if (!cells.length) cells.push();

	const pots = await Pot.getList();

	const loop = async () => {
		const table = createTable({
			head: cells.map(({ title = '' }) => chalk.blue(title)),
			colWidths: cells.map(({ width }) => width || 10),
		});

		const list = await Promise.all(
			pots.map(async (pot) => pot.getStateList({ verbose: true })),
		);
		const stateList = flatten(list).filter(Boolean);

		if (!stateList.length) {
			logUpdate.clear();
			return logger.warn('No process');
		}

		table.push(new Array(cells.length));

		stateList.forEach((state) => {
			table.push(
				cells.map(({ get }) => {
					if (!get) return '';
					const val = get(state, chalk);
					return isUndefined(val) ? '-' : val;
				}),
			);
		});

		let contents = table.toString();
		contents = paddingSpaces + contents.split('\n').join(`\n${paddingSpaces}`);
		logUpdate(`\n\n${contents}\n\n`);
		setTimeout(loop, 1000);
	};

	await loop();
};

list.defaultCells = defaultCells;

export default list;
