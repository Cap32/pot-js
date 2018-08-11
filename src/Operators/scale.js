import { logger } from 'pot-logger';
import { init, ensureTarget, ensureArg } from '../cli/initializer';
import { scale as schema } from '../Schemas/cli';
import inquirer from 'inquirer';
import chalk from 'chalk';

const isValidNumber = (n) => /^-?\d+$/.test(n);

export default async function scale(options = {}) {
	if (options.instances === undefined && isValidNumber(options.name)) {
		const { targetName } = await ensureTarget({}, { noPot: true });
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

	init(schema, options);

	const { pot, targetName } = await ensureTarget(options);
	const errorMessage = 'INVALID number';
	const instances = await ensureArg({
		type: 'input',
		validate: (input) => isValidNumber(input) || errorMessage,
		value: options.instances,
		message: 'Please input instances count (Integer)',
		errorMessage,
	});
	const { ok, added, removed, errors } = await pot.scale(instances);
	pot.disconnect();

	if (errors && errors.length) {
		const { length } = errors;
		logger.warn(`${length} error${length > 1 ? 's' : ''} occurred`);
		errors.forEach((error) => logger.debug(error.stack));
	}

	if (ok) {
		if (added) {
			added.forEach(({ displayName }) => {
				logger.info(chalk.gray(`"${displayName}" created`));
			});
		}
		else if (removed) {
			removed.forEach(({ displayName }) => {
				logger.info(chalk.gray(`"${displayName}" removed`));
			});
		}
		logger.info(`"${targetName}" scale compeleted`);
	}
	else {
		throw new Error(`"${targetName}" scale failed`);
	}
}
