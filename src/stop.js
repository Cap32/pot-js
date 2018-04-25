import { logger } from 'pot-logger';
import { prepareRun, prepareTarget } from './utils/PrepareCli';
import Connection from './Connection';
import inquirer from 'inquirer';
import { stop as schema } from './schemas/cli';

export const stop = async function stop(options = {}) {
	prepareRun(schema, options);
	const { connection, targetName } = await prepareTarget(options);
	const { force } = options;

	if (!force) {
		const confirmed = await inquirer.prompt({
			type: 'confirm',
			name: 'yes',
			message: `Are you sure to stop "${targetName}"?`,
			default: false,
		});

		if (!confirmed.yes) {
			await connection.disconnect();
			logger.warn('Canceled');
			return;
		}
	}

	return connection.requestStopServer({ shouldLog: true });
};

export const stopAll = async function stopAll(options = {}) {
	const names = await Connection.getNames();
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
