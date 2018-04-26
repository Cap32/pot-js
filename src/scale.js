import { logger } from 'pot-logger';
import { prepareRun, prepareTarget } from './utils/PrepareCli';
import { scale as schema } from './schemas/cli';

export default async function scale(options = {}) {
	prepareRun(schema, options);
	const { connection, targetName } = await prepareTarget(options);
	const { ok } = await connection.scale(options.instances);
	if (ok) {
		logger.info(`"${targetName}" scale compeleted`);
	}
	else {
		throw new Error(`"${targetName}" scale failed`);
	}
}
