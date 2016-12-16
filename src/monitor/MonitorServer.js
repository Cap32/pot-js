
import pidUsage from 'pidusage';
import logger from '../utils/logger';
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

export default {
	create(monitor, socket) {
		const handleInfo = (data, sock) => {
			const emit = (rest = {}) => {
				const { data, ...monitorInfo, } = monitor.toJSON();
				const info = {
					memoryUsage: {
						heapUsed: '-',
						heapTotal: '-',
					},
					...monitorInfo,
					...data,
					...rest,
				};

				parseMemoryUsage(info);
				styleStatus(info);

				socket.emit(sock, 'info', info);
			};

			const { pid } = monitor;
			if (pid) {
				pidUsage.stat(pid, (err, { memory }) => {
					let resp = null;
					if (err) { logger.error(err); }
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

		socket.on('info', handleInfo);
	},
};
