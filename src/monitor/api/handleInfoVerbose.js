
import pidUsage from 'pidusage';
import logger from '../../utils/logger';
import formatBytes from '../../utils/formatBytes';
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

const handleInfoVerbose = (monitor, data, callback) => {
	const emit = (rest = {}) => {
		const info = {
			memoryUsage: {
				heapUsed: '-',
				heapTotal: '-',
			},
			...monitor.toJSON(),
			...rest,
		};

		parseMemoryUsage(info);
		styleStatus(info);
		startedLocal(info);

		callback(info);
	};

	const { pid } = monitor;
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
			emit(resp);
		});
		pidUsage.unmonitor(pid);
	}
	else {
		emit();
	}
};

export default handleInfoVerbose;
