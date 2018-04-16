import { logger } from 'pot-logger';
import { join } from 'path';
import Connection from './Connection';
import sliceFile from 'slice-file';
import globby from 'globby';
import ensureSelected from './utils/ensureSelected';
import workspace from './utils/workspace';
import validateBySchema from './utils/validateBySchema';
import { log as schema } from './schemas/cli';

export default async function log(options = {}) {
	validateBySchema(schema, options);
	workspace.set(options);

	const { name, line, category, follow } = options;

	const appName = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running',
		getChoices: Connection.getNames,
	});

	const connection = await Connection.getByName(appName);
	if (!connection) {
		throw new Error(`"${appName}" NOT found`);
	}

	const state = await connection.getState();
	const { logsDir } = state;

	if (!logsDir) {
		logger.warn('Logger is disabled');
		return;
	}

	let appCategory = await ensureSelected({
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
