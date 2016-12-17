
import { getMonitorLogger } from '../utils/logger';
import { trim } from 'lodash';

export default function logSystem(monitor) {
	const logger = getMonitorLogger();

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
