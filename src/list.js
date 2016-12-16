
import logger from './utils/logger';
import { setUpWorkspace } from './utils/config';
import { execAll } from './utils/monitorHelper';
import Table from 'cli-table';
import chalk from 'chalk';
import { isUndefined } from 'lodash';

const list = async (options = {}) => {
	setUpWorkspace(options);

	const infoList = await execAll('info');

	if (!infoList.length) {
		return logger.warn('No process.');
	}

	const table = new Table({
		head: [
			'Name', 'Status', 'Crashes', 'Memory', 'Started', 'Pid', 'Port',
		],
		style: {
			head: ['blue'],
		}
	});

	infoList.filter(Boolean).forEach((info) => {
		const { status, memoryUsage, data = {} } = info;
		const { percent, formattedHeapUsed } = memoryUsage;
		const memory = `${formattedHeapUsed} (${percent})`;
		const styledStatus = (function () {
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
		table.push([
			info.name,
			styledStatus,
			info.crashes,
			memory,
			info.started,
			data.pid,
			data.port,
		].map((val) => isUndefined(val) ? '-' : val));
	});

	console.log(table.toString());
};

export default list;
