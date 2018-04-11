import { logger, setLoggers } from 'pot-logger';
import workspace from './utils/workspace';
import Table from 'cli-table';
import { isUndefined, isFunction } from 'lodash';
import Connection from './Connection';
import logUpdate from 'log-update';
import chalk from 'chalk';

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
	{ title: 'Name', width: 10, get: (state) => state.data.name },
	{ title: 'Status', width: 8, get: (state) => state.styledStatus },
	{ title: 'Crashes', width: 8, get: (state) => state.crashes },
	{
		title: 'Memory',
		width: 18,
		get: (state) => state.data.memoryUsage.formattedString,
	},
	{ title: 'CPU', width: 6, get: (state) => state.data.cpuUsage.percent },
	{ title: 'Started', width: 20, get: (state) => state.startedLocal },
	{ title: 'PPID', width: 6, get: (state) => state.data.parentPid },
	{ title: 'PID', width: 6, get: (state) => state.pid },
];

const list = async (options = {}) => {
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
					const val = get(state);
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

export default list;
