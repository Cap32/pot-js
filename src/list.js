import { logger, setLoggers } from 'pot-logger';
import workspace from './utils/workspace';
import Table from 'cli-table';
import { isUndefined, padEnd } from 'lodash';
import Connection from './Connection';
import logUpdate from 'log-update';

const formatHead = function formatHead(head) {
	switch (head) {
		case 'Memory':
			return padEnd(head, 18, ' ');
		case 'CPU':
			return padEnd(head, 6, ' ');
		default:
			return head;
	}
};

const heads = ['Name', 'Status', 'Crashes', 'Memory', 'CPU', 'Started', 'Pid'];

const list = async (options = {}) => {
	workspace.set(options);

	const {
		head = heads.map(formatHead),
		setTable = (state) => [
			state.data.name,
			state.styledStatus,
			state.crashes,
			state.data.memoryUsage.formattedString,
			state.data.cpuUsage.percent,
			state.startedLocal,
			state.data.parentPid,
		],
		logLevel,
	} = options;

	if (logLevel) {
		setLoggers('logLevel', logLevel);
	}

	const connections = await Connection.getList({ keepAlive: true });

	const loop = async () => {
		const table = new Table({
			head,
			style: {
				head: ['blue'],
			},
		});

		let stateList = await Promise.all(
			connections.map((connection) => connection.getInfoVerbose()),
		);

		stateList = stateList.filter(Boolean);

		if (!stateList.length) {
			logUpdate.clear();
			return logger.warn('No process');
		}

		stateList.forEach((state) => {
			table.push(setTable(state).map((val) => (isUndefined(val) ? '-' : val)));
		});

		logUpdate(table.toString());

		setTimeout(loop, 1000);
	};

	await loop();
};

export default list;
