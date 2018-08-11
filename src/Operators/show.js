import { logger } from 'pot-logger';
import createTable from '../utils/createTable';
import { isObject, isBoolean } from 'lodash';
import chalk from 'chalk';
import { init, ensureTarget } from '../cli/initializer';
import { show as schema } from '../Schemas/cli';
import logSymbols from 'log-symbols';

const defaultCells = [
	['name', (state) => state.name],
	['instance', (state) => state.instanceId],
	['started', (state) => state.monitor.startedLocal],
	['status', (state) => state.monitor.status],
	['crashes', (state) => state.monitor.crashes],
	['entry', (state) => state.entry],
	['args', (state) => state.args],
	['execPath', (state) => state.execPath],
	['execArgs', (state) => state.execArgs],
	['production', (state) => state.production],
	['daemon', (state) => state.daemon],
	['fork', (state) => state.fork],
	['cwd', (state) => state.cwd],
	['baseDir', (state) => state.baseDir],
	['logsDir', (state) => state.logsDir],
	['watch', (state) => state.watch.enable],
	['maxRestarts', (state) => state.maxRestarts],
	['pid', (state) => state.pid],
	['ppid', (state) => state.ppid],
	['memory', (state) => state.memoryUsage.styled],
];

const show = async function show(options = {}) {
	init(schema, options);
	const { cells = defaultCells } = options;
	const { pot } = await ensureTarget(options);

	const table = createTable({ padding: 4 });

	let stateList = await Promise.all(
		pot.instances.map((instance) => instance.getInfoVerbose()),
	);

	pot.disconnect();

	stateList = stateList.filter(Boolean);

	if (!stateList.length) {
		return logger.warn('No process');
	}

	table.push(['']);

	stateList.forEach((state) => {
		table.push(['']);
		table.push([chalk.bgRed(` ${state.displayName} `)]);
		table.push(['']);
		cells.forEach((cell) => {
			if (Array.isArray(cell)) {
				const [key, getValue] = cell;
				const value = (function () {
					const res = getValue(state, chalk);
					const val = res === undefined ? '' : res;
					if (isBoolean(val)) {
						return val ? logSymbols.success : logSymbols.error;
					}
					else if (isObject(val)) {
						return JSON.stringify(val);
					}
					return val.toString();
				})();
				table.push([chalk.blue(key), value]);
			}
			else {
				table.push([cell]);
			}
		});
		table.push(['']);
	});

	table.push(['']);

	console.log(table.toString());
};

show.defaultCells = defaultCells;

export default show;
