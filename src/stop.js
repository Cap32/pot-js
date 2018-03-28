import { logger, setLoggers } from 'pot-logger';
import workspace from './utils/workspace';
import Bridge from './Bridge';
import ensureSelected from './utils/ensureSelected';
import inquirer from 'inquirer';

export const stop = async function stop(options = {}) {
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

	const bridge = await Bridge.getByName(name);

	if (!bridge) {
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

	return bridge.kill({ shouldLog: true });
};

export const stopAll = async function stopAll(options = {}) {
	const names = await Bridge.getNames();
	return Promise.all(names.map(async (name) => stop({ ...options, name })));
};

export default stop;
