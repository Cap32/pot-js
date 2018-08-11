import { logger } from 'pot-logger';
import Pot from '../core/Pot';
import { prepareRun, prepareTarget } from '../utils/PrepareCli';
import { reload as schema } from '../Schemas/cli';

export const reload = async function reload(options = {}) {
	prepareRun(schema, options);
	const { pot, targetName } = await prepareTarget(options);

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
