import { logger } from 'pot-logger';
import Connection from '../Connection';
import { prepareRun, prepareTarget } from '../utils/PrepareCli';
import { reload as schema } from '../Schemas/cli';

export const reload = async function reload(options = {}) {
	prepareRun(schema, options);
	const connectionOptions = { keepAlive: true };
	const { connection, targetName } = await prepareTarget(
		options,
		connectionOptions,
	);

	await connection.reload({
		...options,
		onProgress(ok, state) {
			const displayName = state.displayName || targetName;
			if (ok) {
				logger.info(`"${displayName}" reloaded`);
			}
			else {
				logger.error(`Failed to reload "${displayName}"`);
			}
		},
	});

	logger.info(`"${targetName}" is all reload compeleted`);
};

export const reloadAll = async function reloadAll(options = {}) {
	const names = await Connection.getNames();
	return Promise.all(names.map(async (name) => reload({ ...options, name })));
};
