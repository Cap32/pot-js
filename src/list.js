
import logger from './utils/logger';
import workspace from './utils/workspace';
import { requestAll } from './utils/socketsHelper';
import Table from 'cli-table';
import { isUndefined } from 'lodash';

const list = async (options = {}) => {
	workspace.set(options);

	const infoList = await requestAll('infoVerbose');

	if (!infoList.length) {
		return logger.warn('No process.');
	}

	const {
		head = [
			'Name', 'Status', 'Crashes', 'Memory', 'Started', 'Pid',
		],
		setTable = (info) => [
			info.data.name,
			info.styledStatus,
			info.crashes,
			info.memoryUsage.formattedString,
			info.startedLocal,
			info.data.parentPid,
		],
	} = options;

	const table = new Table({
		head,
		style: {
			head: ['blue'],
		},
	});

	infoList.filter(Boolean).forEach((info) => {
		table.push(setTable(info).map((val) => isUndefined(val) ? '-' : val));
	});

	console.log(table.toString());
};

export default list;
