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
		setTable = (state) => [
			state.data.name,
			state.styledStatus,
			state.crashes,
			state.data.memoryUsage.formattedString,
			state.data.cpuUsage.percent,
			state.startedLocal,
			state.data.parentPid,
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

		const stateList = await Promise.all(
			connections.map((connection) => connection.getInfoVerbose()),
		);

		stateList.filter(Boolean).forEach((state) => {
			table.push(setTable(state).map((val) => (isUndefined(val) ? '-' : val)));
		});

		logUpdate(table.toString());

		setTimeout(loop, 1000);
	};

	await loop();
};

export default list;
