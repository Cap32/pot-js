import { logger } from 'pot-logger';
import Pot from '../core/Pot';
import { init, ensureTarget } from '../cli/initializer';
import { reload as schema } from '../Schemas/cli';

export const reload = async function reload(options = {}) {
	init(schema, options);
	const { pot, targetName } = await ensureTarget(options);

	await pot.reload({
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

	pot.disconnect();

	logger.info(`"${targetName}" is all reload compeleted`);
};

export const reloadAll = async function reloadAll(options = {}) {
	const names = await Pot.getNames();
	return Promise.all(names.map(async (name) => reload({ ...options, name })));
};
