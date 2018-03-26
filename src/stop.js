import { logger, setLoggers } from 'pot-logger';
import workspace from './utils/workspace';
import PidManager from './utils/PidManager';
import Bridge from './Bridge';
import ensureSelected from './utils/ensureSelected';
import inquirer from 'inquirer';

export const stop = async function stop(options = {}) {

	// require('node-notifier').notify('stop');

	let { name } = options;
	const { force, logLevel } = options;

	workspace.set(options);
	setLoggers('logLevel', logLevel);

	name = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running',
		getChoices: Bridge.getNames,
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

export const stopAll = async function stopAll(options = {}) {
	const names = await Bridge.getNames();
	return Promise.all(names.map(async (name) => stop({ ...options, name })));
};

export default stop;
