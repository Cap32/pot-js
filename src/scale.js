import { logger, setLoggers } from 'pot-logger';
import Connection from './Connection';
import ensureSelected from './utils/ensureSelected';
import workspace from './utils/workspace';
import validateBySchema from './utils/validateBySchema';
import { scale as schema } from './schemas/cli';

export default async function scale(options = {}) {
	validateBySchema(schema, options);

	workspace.set(options);
	setLoggers('logLevel', options.logLevel);

	const { name, instances } = options;

	const appName = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running.',
		getChoices: Connection.getNames,
	});

	const throwError = function throwError(message) {
		throw new Error(message || `"${appName}" NOT found`);
	};

	const connection = await Connection.getByName(appName);

	if (!connection) throwError();

	const { ok } = await connection.scale(instances);

	if (ok) logger.info(`"${appName}" scale compeleted`);
	else throwError(`"${appName}" scale failed`);
}
