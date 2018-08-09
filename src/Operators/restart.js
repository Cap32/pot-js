import { logger } from 'pot-logger';
import Pot from '../core/Pot';
import { prepareRun, prepareTarget } from '../utils/PrepareCli';
import { restart as schema } from '../Schemas/cli';

export const restart = async function restart(options = {}) {
	prepareRun(schema, options);
	const { pot, targetName } = await prepareTarget(options);
	const ok = await pot.restart();
	if (ok) logger.info(`"${targetName}" restarted`);
	else logger.error(`Failed to restart "${targetName}"`);
};

export const restartAll = async function restartAll(options = {}) {
	const names = await Pot.getNames();
	return Promise.all(names.map(async (name) => restart({ ...options, name })));
};
