import { logger } from 'pot-logger';
import workspace from './utils/workspace';
import Table from 'cli-table';
import { isUndefined } from 'lodash';
import Connection from './Connection';
import logUpdate from 'log-update';

const list = async (options = {}) => {
	workspace.set(options);

	const {
		head = ['Name', 'Status', 'Crashes', 'Memory', 'CPU', 'Started', 'Pid'],
		setTable = (info) => [
			info.data.name,
			info.styledStatus,
			info.crashes,
			info.memoryUsage.formattedString,
			info.cpuUsage.percent,
			info.startedLocal,
			info.data.parentPid,
		],
	} = options;

	const loop = async () => {
		const table = new Table({
			head,
			style: {
				head: ['blue'],
			},
		});

		const connections = await Connection.getList();

		if (!connections.length) {
			return logger.warn('No process');
		}

		const infoList = await Promise.all(
			connections.map((connection) => connection.getInfoVerbose()),
		);

		infoList.filter(Boolean).forEach((info) => {
			table.push(setTable(info).map((val) => (isUndefined(val) ? '-' : val)));
		});

		logUpdate(table.toString());

		setTimeout(loop, 1000);
	};

	await loop();
};

export default list;
