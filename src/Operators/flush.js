import { logger } from 'pot-logger';
import Connection from '../Connection';
import { prepareRun, prepareTarget } from '../utils/PrepareCli';
import { flush as schema } from '../Schemas/cli';

export const flush = async function flush(options = {}) {
	prepareRun(schema, options);
	const { connection, targetName } = await prepareTarget(options);
	await connection.flush();
	logger.info(`"${targetName}" flushed`);
};

export const flushAll = async function flushAll(options = {}) {
	const names = await Connection.getNames();
	Connection.flushOffline(names);
	return Promise.all(names.map(async (name) => flush({ ...options, name })));
};
