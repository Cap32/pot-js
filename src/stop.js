
import logger, { setLevel } from './utils/logger';
import workspace from './utils/workspace';
import PidManager from './utils/PidManager';
import { getNames } from './utils/socketsHelper';
import ensureSelected from './utils/ensureSelected';
import inquirer from 'inquirer';

const stop = async (options = {}) => {
	let { name } = options;
	const { force, logLevel } = options;

	workspace.set(options);
	setLevel(logLevel);

	name = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running',
		getChoices: getNames,
	});

	name += ''; // prevent `name` is `Number`

	const pidManager = await PidManager.find(name);

	if (!pidManager.isRunning) {
		logger.error(`"${name}" NOT found`);
		return false;
	}

	if (!force) {
		const confirmed = await inquirer.prompt({
			type: 'confirm',
			name: 'yes',
			message: `Are you sure to stop "${name}"?`,
			default: false,
		});

		if (!confirmed.yes) {
			return false;
		}
	}

	return pidManager.kill({ shouldLog: true });
};

export default stop;
