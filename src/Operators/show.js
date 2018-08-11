import { logger } from 'pot-logger';
import createTable from '../utils/createTable';
import { isObject, isBoolean } from 'lodash';
import chalk from 'chalk';
import { init, ensureTarget } from '../cli/initializer';
import { show as schema } from '../Schemas/cli';
import logSymbols from 'log-symbols';

const defaultCells = [
	['args', (state) => state.args],
	['baseDir', (state) => state.baseDir],
	['cluster', (state) => state.cluster],
	['crashes', (state) => state.monitor.crashes],
	['cwd', (state) => state.cwd],
	['daemon', (state) => state.daemon],
	['entry', (state) => state.entry],
	['execPath', (state) => state.execPath],
	['execArgs', (state) => state.execArgs],
	['instanceId', (state) => state.instanceId],
	['logsDir', (state) => state.logsDir],
	['maxRestarts', (state) => state.maxRestarts],
	['memory', (state) => state.memoryUsage.styled],
	['name', (state) => state.name],
	['pid', (state) => state.pid],
	['ppid', (state) => state.ppid],
	['production', (state) => state.production],
	['started', (state) => state.monitor.startedLocal],
	['status', (state) => state.monitor.status],
	['watch', (state) => state.watch.enable],
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
