
import logger from './utils/logger';
import { join } from 'path';
import { requestByName, getNames } from './utils/socketsHelper';
import sliceFile from 'slice-file';
import globby from 'globby';
import ensureSelected from './utils/ensureSelected';

const log = async ({ name, line, category, follow }) => {
	name = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running.',
		getChoices: getNames,
	});

	const info = await requestByName(name, 'info');
	if (!info) {
		throw new Error(`"${name}" is NOT found.`);
	}

	const { logsDir } = info;

	category = await ensureSelected({
		value: category,
		message: 'Please select a log file.',
		errorMessage: 'Log file NOT found.',
		getChoices: () => globby('*.log', { cwd: logsDir }),
	});

	if (!category.endsWith('.log')) { category += '.log'; }

	const logFile = join(logsDir, category);
	const sf = sliceFile(logFile);
	const mode = follow ? 'follow' : 'slice';

	sf.on('error', (err) => {
		if (err.code !== 'ENOENT') { throw err; }
		logger.warn('Log file NOT found.');
	});
	sf[mode](-line).pipe(process.stdout);
};

export default log;
