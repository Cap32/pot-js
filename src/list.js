
import logger from './utils/logger';
import { setUpWorkspace } from './utils/config';
import { requestAll } from './utils/socketsHelper';
import Table from 'cli-table';
import { isUndefined } from 'lodash';

const list = async (options = {}) => {
	const infoList = await requestAll('infoVerbose');

	if (!infoList.length) {
		return logger.warn('No process.');
	}

	const {
		head = [
			'Name', 'Status', 'Crashes', 'Memory', 'Started', 'Pid',
		],
		setTable = (info) => [
			info.name,
			info.styledStatus,
			info.crashes,
			info.memoryUsage.formattedString,
			info.startedLocal,
			info.parentPid,
		],
	} = setUpWorkspace(options);

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
