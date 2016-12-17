
import logger from './utils/logger';
import { join } from 'path';
import { requestByName } from './utils/socketsHelper';
import sliceFile from 'slice-file';

const log = async ({ name, line, category, follow }) => {
	const info = await requestByName(name, 'info');
	if (!info) {
		throw new Error(`"${name}" is NOT found.`);
	}

	const { logsDir } = info;
	const logFile = join(logsDir, `${category}.log`);
	const sf = sliceFile(logFile);
	const mode = follow ? 'follow' : 'slice';
	sf.on('error', (err) => {
		if (err.code !== 'ENOENT') { throw err; }
		logger.warn('Log file NOT found.');
	});
	sf[mode](-line).pipe(process.stdout);
};

export default log;
