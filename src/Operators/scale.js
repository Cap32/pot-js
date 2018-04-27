import { logger } from 'pot-logger';
import { prepareRun, prepareTarget, ensureArg } from '../utils/PrepareCli';
import { scale as schema } from '../schemas/cli';
import inquirer from 'inquirer';

const isValidNumber = (n) => /^-?\d+$/.test(n);

export default async function scale(options = {}) {
	if (options.instances === undefined && isValidNumber(options.name)) {
		const { targetName } = await prepareTarget({}, { noConnection: true });
		const maybeInstances = options.name;
		const promptOptions = {
			name: 'instance',
			type: 'confirm',
			message: `Did you mean \`scale ${targetName} ${maybeInstances}\`?`,
		};
		const anweser = await inquirer.prompt(promptOptions);
		if (anweser.instance) {
			options.instances = maybeInstances;
			delete options.name;
		}
	}

	prepareRun(schema, options);

	const { connection, targetName } = await prepareTarget(options);
	const errorMessage = 'INVALID number';
	const instances = await ensureArg({
		type: 'input',
		validate: (input) => isValidNumber(input) || errorMessage,
		value: options.instances,
		message: 'Please input instances count (Integer)',
		errorMessage,
	});
	const { ok, added, removed, errors } = await connection.scale(instances);

	if (errors && errors.length) {
		const { length } = errors;
		logger.warn(`${length} error${length > 1 ? 's' : ''} occurred`);
		errors.forEach((error) => logger.debug(error.stack));
	}

	if (ok) {
		if (added) {
			added.forEach(({ displayName }) => {
				logger.info(`"${displayName}" created`);
			});
		}
		else if (removed) {
			removed.forEach(({ displayName }) => {
				logger.info(`"${displayName}" removed`);
			});
		}
		logger.info(`"${targetName}" scale compeleted`);
	}
	else {
		throw new Error(`"${targetName}" scale failed`);
	}
}
