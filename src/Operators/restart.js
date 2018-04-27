import { logger } from 'pot-logger';
import Connection from '../Connection';
import { prepareRun, prepareTarget } from '../utils/PrepareCli';
import { restart as schema } from '../schemas/cli';

export const restart = async function restart(options = {}) {
	prepareRun(schema, options);
	const { connection, targetName } = await prepareTarget(options);
	const ok = await connection.restart();
	if (ok) logger.info(`"${targetName}" restarted`);
	else logger.error(`Failed to restart "${targetName}"`);
};

export const restartAll = async function restartAll(options = {}) {
	const names = await Connection.getNames();
	return Promise.all(names.map(async (name) => restart({ ...options, name })));
};
