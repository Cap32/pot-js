import { logger, setLoggers } from 'pot-logger';
import workspace from './utils/workspace';
import Connection from './Connection';
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
		getChoices: Connection.getNames,
	});

	name += ''; // prevent `name` is `Number`

	const connection = await Connection.getByName(name);

	if (!connection) {
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

	return connection.requestStopServer({ shouldLog: true });
};

export const stopAll = async function stopAll(options = {}) {
	const names = await Connection.getNames();
	return Promise.all(names.map(async (name) => stop({ ...options, name })));
};

export default stop;
