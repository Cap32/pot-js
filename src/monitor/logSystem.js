
import getFileLogger from '../utils/getFileLogger';
import { trim } from 'lodash';

export default async function logSystem(monitor, { logsDir, logLevel }) {
	const logger = await getFileLogger(logsDir, logLevel);

	monitor.on('stdout', (data) => {
		logger.info(trim(data.toString()));
	});

	monitor.on('stderr', (data) => {
		logger.error(trim(data.toString()));
	});

	monitor.on('warn', (data) => {
		logger.error(trim(data.toString()));
	});
}
