import { logger, setLoggers } from 'pot-logger';
import Connection from './Connection';
import ensureSelected from './utils/ensureSelected';
import workspace from './utils/workspace';
import validateBySchema from './utils/validateBySchema';
import { restart as schema } from './schemas/cli';

export const restart = async function restart(options = {}) {
	validateBySchema(schema, options);

	workspace.set(options);
	setLoggers('logLevel', options.logLevel);

	const { name } = options;

	const appName = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running.',
		getChoices: Connection.getNames,
	});

	const connection = await Connection.getByName(appName);

	if (!connection) {
		throw new Error(`"${appName}" NOT found`);
	}

	const ok = await connection.restart();
	if (ok) {
		logger.info(`"${appName}" restarted`);
	}
	else {
		logger.error(`Failed to restart "${appName}"`);
	}
};

export const restartAll = async function restartAll(options = {}) {
	const names = await Connection.getNames();
	return Promise.all(names.map(async (name) => restart({ ...options, name })));
};
