import { logger } from 'pot-logger';
import Pot from '../core/Pot';
import { init, ensureTarget } from '../cli/initializer';
import { restart as schema } from '../Schemas/cli';

export const restart = async function restart(options = {}) {
	init(schema, options);
	const { pot, targetName } = await ensureTarget(options);
	const ok = await pot.restart();
	pot.disconnect();
	if (ok) logger.info(`"${targetName}" restarted`);
	else logger.error(`Failed to restart "${targetName}"`);
};

export const restartAll = async function restartAll(options = {}) {
	const names = await Pot.getNames();
	return Promise.all(names.map(async (name) => restart({ ...options, name })));
};
