
import { logger } from 'pot-logger';
import workspace from './utils/workspace';
import Table from 'cli-table';
import { isUndefined } from 'lodash';
import Bridge from './Bridge';

const list = async (options = {}) => {
	workspace.set(options);

	const bridges = await Bridge.getList();

	if (!bridges.length) {
		return logger.warn('No process');
	}

	const infoList = await Promise.all(
		bridges.map((bridge) => bridge.getInfoVerbose())
	);

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
