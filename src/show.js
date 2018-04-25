import { logger, setLoggers } from 'pot-logger';
import workspace from './utils/workspace';
import createTable from './utils/createTable';
import { isObject, isBoolean } from 'lodash';
import ensureSelected from './utils/ensureSelected';
import Connection from './Connection';
import chalk from 'chalk';
import validateBySchema from './utils/validateBySchema';
import { show as schema } from './schemas/cli';
import logSymbols from 'log-symbols';

if (process.env !== 'production') {
	process.on('unhandledRejection', (reason, promise) => {
		console.warn('unhandledRejection: ' + reason);
		console.error(promise);
	});
}

const defaultCells = (state) => [
	['name', state.name],
	['instance', state.instanceId],
	['started', state.monitor.startedLocal],
	['status', state.monitor.status],
	['crashes', state.monitor.crashes],
	['entry', state.entry],
	['args', state.args],
	['execPath', state.execPath],
	['execArgs', state.execArgs],
	['production', state.production],
	['daemon', state.daemon],
	['fork', state.fork],
	['cwd', state.cwd],
	['baseDir', state.baseDir],
	['watch', state.watch.enable],
	['maxRestarts', state.maxRestarts],
	['pid', state.pid],
	['ppid', state.ppid],
	['memory', state.memoryUsage.styled],
];

export default async function show(options = {}) {
	validateBySchema(schema, options);
	workspace.set(options);
	setLoggers('logLevel', options.logLevel);

	const { name, cells = defaultCells } = options;

	const appName = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running.',
		getChoices: Connection.getNames,
	});

	const throwError = function throwError(message) {
		throw new Error(message || `"${appName}" NOT found`);
	};

	const connection = await Connection.getByName(appName);

	if (!connection) throwError();

	const table = createTable({ padding: 4 });

	let stateList = await Promise.all(
		connection.instances.map((instance) => instance.getInfoVerbose()),
	);

	stateList = stateList.filter(Boolean);

	if (!stateList.length) {
		return logger.warn('No process');
	}

	table.push(['']);

	stateList.forEach((state) => {
		table.push(['']);
		table.push([chalk.bgRed(` ${state.displayName} `)]);
		table.push(['']);
		cells(state).forEach((cell) => {
			if (Array.isArray(cell)) {
				const [key, value] = cell;
				const val = (function () {
					const val = value === undefined ? '' : value;
					if (isBoolean(val)) {
						return val ? logSymbols.success : logSymbols.error;
					}
					else if (isObject(val)) {
						return JSON.stringify(val);
					}
					return val.toString();
				})();
				table.push([chalk.blue(key), val]);
			}
			else {
				table.push([cell]);
			}
		});
		table.push(['']);
	});

	table.push(['']);

	console.log(table.toString());
}
