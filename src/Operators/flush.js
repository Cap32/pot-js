import { logger, flush as flushLogFiles } from 'pot-logger';
import Connection from '../Connection';
import { prepareRun, prepareTarget } from '../utils/PrepareCli';
import { flush as schema } from '../schemas/cli';
import globby from 'globby';
import workspace from '../utils/workspace';
import { difference } from 'lodash';
import { join } from 'path';

const flushOfflineDirs = async function flushOfflineDirs(onlineNames) {
	try {
		const cwd = await workspace.getLogsDir();
		const all = await globby('*', {
			onlyDirectories: true,
			cwd,
		});
		const offlines = difference(all, onlineNames);
		await Promise.all(
			offlines.map(async (name) => {
				const logsDir = join(cwd, name);
				return flushLogFiles({ logsDir, removeDir: true });
			}),
		);
	}
	catch (err) {}
};

export const flush = async function flush(options = {}) {
	prepareRun(schema, options);
	const { connection, targetName } = await prepareTarget(options);
	const stateList = await connection.each('getState');
	const logs = stateList
		.filter(({ logsDir }) => !!logsDir)
		.map(({ logsDir, monitor }) => ({
			logsDir,
			removeDir: monitor.status !== 'running',
		}));
	await Promise.all(logs.map(flushLogFiles));
	logger.info(`"${targetName}" flushed`);
};

export const flushAll = async function flushAll(options = {}) {
	const names = await Connection.getNames();
	flushOfflineDirs(names);
	return Promise.all(names.map(async (name) => flush({ ...options, name })));
};
