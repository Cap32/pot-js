import { logger } from 'pot-logger';
import Pot from '../core/Pot';
import { prepareRun, prepareTarget } from '../utils/PrepareCli';
import { flush as schema } from '../Schemas/cli';

export const flush = async function flush(options = {}) {
	prepareRun(schema, options);
	const { pot, targetName } = await prepareTarget(options);
	await pot.flush();
	logger.info(`"${targetName}" flushed`);
};

export const flushAll = async function flushAll(options = {}) {
	const names = await Pot.getNames();
	Pot.flushOffline(names);
	return Promise.all(names.map(async (name) => flush({ ...options, name })));
};
