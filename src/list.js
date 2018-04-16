import { logger, setLoggers } from 'pot-logger';
import workspace from './utils/workspace';
import Table from 'cli-table';
import { isUndefined, isFunction } from 'lodash';
import Connection from './Connection';
import logUpdate from 'log-update';
import chalk from 'chalk';
import validateBySchema from './utils/validateBySchema';
import { list as schema } from './schemas/cli';

const paddingSpaces = '    ';
const tableOptions = {
	chars: {
		top: '',
		'top-mid': '',
		'top-left': '',
		'top-right': '',
		bottom: '',
		'bottom-mid': '',
		'bottom-left': '',
		'bottom-right': '',
		left: '',
		'left-mid': '',
		mid: '',
		'mid-mid': '',
		right: '',
		'right-mid': '',
		middle: ' ',
	},
	style: {
		head: [],
		border: [],
		compact: true,
		'padding-left': 0,
		'padding-right': 0,
	},
};

const defaultCells = [
	{ title: 'Name', width: 10, get: (state) => state.name },
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
	{ title: 'PPID', width: 6, get: (state) => state.ppid },
	{ title: 'PID', width: 6, get: (state) => state.pid },
];

export default async function list(options = {}) {
	validateBySchema(schema, options);
	workspace.set(options);

	const { cells: getCells = defaultCells, logLevel } = options;
	const cells = isFunction(getCells) ? getCells(defaultCells) : getCells;

	if (logLevel) {
		setLoggers('logLevel', logLevel);
	}

	if (!cells.length) {
		cells.push();
	}

	const connections = await Connection.getList({ keepAlive: true });

	const loop = async () => {
		const table = new Table({
			...tableOptions,
			head: cells.map(({ title = '' }) => chalk.blue(title)),
			colWidths: cells.map(({ width }) => width || 10),
		});

		let stateList = await Promise.all(
			connections.map((connection) => connection.getInfoVerbose()),
		);

		stateList = stateList.filter(Boolean);

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
}
