import { logger } from 'pot-logger';
import { prepareRun, prepareTarget, ensureArg } from '../utils/PrepareCli';
import { scale as schema } from '../schemas/cli';

export default async function scale(options = {}) {
	prepareRun(schema, options);
	const { connection, targetName } = await prepareTarget(options);
	const errorMessage = 'INVALID number';
	const instances = await ensureArg({
		type: 'input',
		validate: (input) => /^-?\d+$/.test(input) || errorMessage,
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
