
import pidUsage from 'pidusage';
import { logger } from 'pot-logger';
import formatBytes from '../utils/formatBytes';
import chalk from 'chalk';

const { assign } = Object;

const parseMemoryUsage = (info) => {
	const { memoryUsage: data } = info;
	const { heapUsed, heapTotal } = data;

	if (heapUsed === '-') {
		assign(data, {
			percent: '-',
			formattedHeapUsed: '-',
		});
	}
	else {
		assign(data, {
			percent: `${(heapUsed / heapTotal / 100).toFixed(2)}%`,
			formattedHeapUsed: formatBytes(heapUsed),
		});
	}

	data.formattedString = `${data.formattedHeapUsed} (${data.percent})`;
	info.memoryUsage = data;
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
					heapUsed: '-',
					heapTotal: '-',
				},
				...state,
				...rest,
			};

			parseMemoryUsage(info);
			styleStatus(info);
			startedLocal(info);

			resolve(info);
		};

		const { pid } = state;
		if (pid) {
			pidUsage.stat(pid, (err, { memory }) => {
				let resp = null;
				if (err) {
					logger.error(err.message);
					logger.debug(err);
				}
				else {
					resp = {
						memoryUsage: {
							heapUsed: memory,
							heapTotal: process.memoryUsage().heapTotal,
						},
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
