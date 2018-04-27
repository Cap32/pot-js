import { logger, flush as flushLogFiles } from 'pot-logger';
import Connection from '../Connection';
import { prepareRun, prepareTarget } from '../utils/PrepareCli';
import { flush as schema } from '../schemas/cli';

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
	return Promise.all(names.map(async (name) => flush({ ...options, name })));
};
