
import pidUsage from 'pidusage';
import { logger } from 'pot-logger';
import formatBytes from '../utils/formatBytes';
import chalk from 'chalk';
import { totalmem } from 'os';

const { assign } = Object;

const parseMemoryUsage = (info) => {
	const {
		memoryUsage: {
			heapUsed, heapTotal, rss, total: totalMemory,
		},
		memoryUsage,
	} = info;

	// DEPRECATED: `heapTotal` is wrong value
	const total = totalMemory || heapTotal;
	const used = rss || heapUsed;

	if (isNaN(used) || isNaN(total)) {
		assign(memoryUsage, {
			percent: '-',
			formattedHeapUsed: '-', // DEPRECATED
			formattedUsed: '-',
		});
	}
	else {
		const formattedUsed = formatBytes(used);
		assign(memoryUsage, {
			percent: `${(used / total * 100).toFixed(2)}%`,
			formattedHeapUsed: formattedUsed, // DEPRECATED
			formattedUsed,
		});
	}

	memoryUsage.formattedString =
		`${memoryUsage.formattedHeapUsed} (${memoryUsage.percent})`;
	return info;
};

const parseCpuUsage = (info) => {
	const { cpuUsage, data } = info;
	const total = (function () {
		try { return data.cpuUsage.total; }
		catch (err) { return NaN; }
	}());
	const val = cpuUsage.user / total;
	cpuUsage.percent = isNaN(val) ? '-' : `${(val / 100).toFixed(2)}%`;
	cpuUsage.formattedString = cpuUsage.percent;
	return info;
};

const styleStatus = (info) => {
	const { status } = info;
	info.styledStatus = (function () {
		switch (status) {
			case 'running':
				return chalk.green(status);
			case 'stopped':
			case 'crashed':
				return chalk.red(status);
			case 'sleeping':
				return chalk.magenta(status);
			default:
				return status;
		}
	}());
	return info;
};

const startedLocal = (info) => {
	info.startedLocal = new Date(info.started).toLocaleString();
	return info;
};

export default function handleInfoVerbose(state) {
	return new Promise((resolve) => {
		const callback = (rest = {}) => {
			const info = {
				memoryUsage: {
					heapUsed: NaN,
					heapTotal: NaN,
					rss: NaN,
					total: NaN,
				},
				cpuUsage: {
					user: NaN,
					system: NaN,
				},
				...state,
				...rest,
			};

			parseMemoryUsage(info);
			parseCpuUsage(info);
			styleStatus(info);
			startedLocal(info);

			resolve(info);
		};

		const { pid } = state;
		if (pid) {
			pidUsage.stat(pid, (err, pidState = {}) => {
				let resp = null;
				if (err) {
					logger.error(err.message);
					logger.debug(err);
				}
				else {
					const { memory, cpu } = pidState;
					const total = totalmem();
					resp = {
						memoryUsage: {
							heapUsed: memory, // DEPRECATED: it's wrong value here
							heapTotal: total, // DEPRECATED: it's wrong value here
							rss: memory,
							total,
						},
						cpuUsage: { user: cpu },
					};
				}
				callback(resp);
			});
			pidUsage.unmonitor(pid);
		}
		else {
			callback();
		}
	});
};
