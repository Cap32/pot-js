import { logger, setLoggers } from 'pot-logger';
import Connection from './Connection';
import ensureSelected from './utils/ensureSelected';
import workspace from './utils/workspace';
import validateBySchema from './utils/validateBySchema';
import { reload as schema } from './schemas/cli';
import delay from 'delay';

export const reload = async function reload(options = {}) {
	validateBySchema(schema, options);

	workspace.set(options);
	setLoggers('logLevel', options.logLevel);

	const { name, delay: totalTimeout } = options;

	const appName = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running.',
		getChoices: Connection.getNames,
	});

	const throwError = function throwError() {
		throw new Error(`"${appName}" NOT found`);
	};

	const connection = await Connection.getByName(appName, { keepAlive: true });

	if (!connection) throwError();

	const { instances } = connection;
	const { length } = instances;

	if (!length) throwError();

	const eachTimeout = length > 1 ? Math.max(100, totalTimeout / length) : 0;

	for (const instance of instances) {
		const state = await instance.getState();
		const displayName = (state && state.displayName) || appName;
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

	logger.info(`"${appName}" is all reload compeleted`);
};

export const reloadAll = async function reloadAll(options = {}) {
	const names = await Connection.getNames();
	return Promise.all(names.map(async (name) => reload({ ...options, name })));
};
