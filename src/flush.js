import { logger } from 'pot-logger';
import { remove } from 'fs-extra';
import Connection from './Connection';
import { prepareRun, prepareTarget } from './utils/PrepareCli';
import { flush as schema } from './schemas/cli';

export const flush = async function flush(options = {}) {
	prepareRun(schema, options);
	const { connection, targetName } = await prepareTarget(options);
	const stateList = await connection.each('getState');
	const logsDirs = stateList.map(({ logsDir }) => logsDir).filter(Boolean);
	await Promise.all(logsDirs.map(remove));
	logger.info(`"${targetName}" flushed`);
};

export const flushAll = async function flushAll(options = {}) {
	const names = await Connection.getNames();
	return Promise.all(names.map(async (name) => flush({ ...options, name })));
};
