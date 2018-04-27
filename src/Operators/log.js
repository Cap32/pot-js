import { logger } from 'pot-logger';
import { join } from 'path';
import sliceFile from 'slice-file';
import globby from 'globby';
import { prepareRun, prepareTarget, ensureArg } from '../utils/PrepareCli';
import { log as schema } from '../schemas/cli';

export default async function log(options = {}) {
	prepareRun(schema, options);

	const { line, category, follow } = options;
	const { connection, targetName } = await prepareTarget(options);

	const state = await connection.getState();
	if (!state) {
		throw new Error(`"${targetName}" NOT found`);
	}

	const { logsDir } = state;

	if (!logsDir) {
		logger.warn('Logger is disabled');
		return;
	}

	let appCategory = await ensureArg({
		value: category,
		message: 'Please select a log file',
		errorMessage: 'Log file NOT found',
		getChoices: () => globby('*.log', { cwd: logsDir }),
	});

	if (!appCategory.endsWith('.log')) {
		appCategory += '.log';
	}

	const logFile = join(logsDir, appCategory);
	const sf = sliceFile(logFile);
	const mode = follow ? 'follow' : 'slice';

	sf.on('error', (err) => {
		if (err.code !== 'ENOENT') {
			throw err;
		}
		logger.warn('Log file NOT found');
	});
	sf[mode](-line).pipe(process.stdout);
}
