import { logger } from 'pot-logger';
import { init, ensureTarget } from '../cli/initializer';
import Pot from '../core/Pot';
import inquirer from 'inquirer';
import { stop as schema } from '../Schemas/cli';
import getInstanceDisplayName from '../utils/getInstanceDisplayName';

export const stop = async function stop(options = {}) {
	init(schema, options);
	const { pot, targetName } = await ensureTarget(options);
	const { force, instanceNum } = options;
	const displayName = getInstanceDisplayName(targetName, instanceNum);

	if (instanceNum) {
		const hasInstanceNum = await pot.hasInstanceNum(instanceNum);
		if (!hasInstanceNum) {
			await pot.disconnect();
			logger.warn(`"${displayName}" is NOT running`);
			return;
		}
	}

	if (!force) {
		const confirmed = await inquirer.prompt({
			type: 'confirm',
			name: 'yes',
			message: `Are you sure to stop "${displayName}"?`,
			default: false,
		});

		if (!confirmed.yes) {
			await pot.disconnect();
			logger.warn('Canceled');
			return;
		}
	}

	return pot.requestShutDown({ shouldLog: true, instanceNum });
};

export const stopAll = async function stopAll(options = {}) {
	const names = await Pot.getNames();
	if (options.force) {
		await Promise.all(names.map(async (name) => stop({ ...options, name })));
	}
	else {
		for (const name of names) {
			await stop({ ...options, name });
		}
	}
};

export default stop;
