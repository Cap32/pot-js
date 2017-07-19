
import { logger } from './utils/logger';
import { join } from 'path';
import Bridge from './Bridge';
import sliceFile from 'slice-file';
import globby from 'globby';
import ensureSelected from './utils/ensureSelected';
import workspace from './utils/workspace';

const log = async (options) => {
	workspace.set(options);

	const { name, line, category, follow } = options;

	const appName = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running',
		getChoices: Bridge.getNames,
	});

	const bridge = await Bridge.getByName(appName);
	if (!bridge) {
		throw new Error(`"${appName}" NOT found`);
	}

	const info = await bridge.getInfo();
	const { logsDir } = info.data;

	let appCategory = await ensureSelected({
		value: category,
		message: 'Please select a log file.',
		errorMessage: 'Log file NOT found.',
		getChoices: () => globby('*.log', { cwd: logsDir }),
	});

	if (!appCategory.endsWith('.log')) { appCategory += '.log'; }

	const logFile = join(logsDir, appCategory);
	const sf = sliceFile(logFile);
	const mode = follow ? 'follow' : 'slice';

	sf.on('error', (err) => {
		if (err.code !== 'ENOENT') { throw err; }
		logger.warn('Log file NOT found.');
	});
	sf[mode](-line).pipe(process.stdout);
};

export default log;
