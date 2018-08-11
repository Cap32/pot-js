import { logger } from 'pot-logger';
import Pot from '../core/Pot';
import { init, ensureTarget } from '../cli/initializer';
import { flush as schema } from '../Schemas/cli';

export const flush = async function flush(options = {}) {
	init(schema, options);
	const { pot, targetName } = await ensureTarget(options);
	await pot.flush();
	pot.disconnect();
	logger.info(`"${targetName}" flushed`);
};

export const flushAll = async function flushAll(options = {}) {
	const names = await Pot.getNames();
	Pot.flushOffline(names);
	return Promise.all(names.map(async (name) => flush({ ...options, name })));
};
