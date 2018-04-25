import { logger } from 'pot-logger';
import Connection from './Connection';
import { prepareRun, prepareTarget } from './utils/PrepareCli';
import { reload as schema } from './schemas/cli';
import delay from 'delay';

export const reload = async function reload(options = {}) {
	prepareRun(schema, options);
	const { delay: totalTimeout } = options;
	const connectionOptions = { keepAlive: true };
	const { connection, targetName } = await prepareTarget(
		options,
		connectionOptions,
	);
	const { instances } = connection;
	const { length } = instances;
	const eachTimeout = length > 1 ? Math.max(100, totalTimeout / length) : 0;

	for (const instance of instances) {
		const state = await instance.getState();
		const displayName = (state && state.displayName) || targetName;
		const ok = await instance.restart();
		if (ok) {
			logger.info(`"${displayName}" reloaded`);
		}
		else {
			logger.error(`Failed to reload "${displayName}"`);
		}
		await instance.disconnect();
		await delay(eachTimeout);
	}

	logger.info(`"${targetName}" is all reload compeleted`);
};

export const reloadAll = async function reloadAll(options = {}) {
	const names = await Connection.getNames();
	return Promise.all(names.map(async (name) => reload({ ...options, name })));
};
