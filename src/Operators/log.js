import { logger } from 'pot-logger';
import { join } from 'path';
import sliceFile from 'slice-file';
import globby from 'globby';
import { init, ensureTarget, ensureArg } from '../cli/initializer';
import { log as schema } from '../Schemas/cli';

export default async function log(options = {}) {
	init(schema, options);

	const { line, category, follow } = options;
	const { pot, targetName } = await ensureTarget(options);

	const state = await pot.getState();
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
		getChoices: async () => {
			const list = await globby('*.log', { cwd: logsDir });
			return list.filter((path) => !/\d+\.log$/.test(path));
		},
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
