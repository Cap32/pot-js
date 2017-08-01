
import logger from 'pot-logger';
import { trim } from 'lodash';

export default function logSystem(monitor) {
	monitor.on('stdout', (data) => {
		logger.info(trim(data.toString()));
	});

	monitor.on('stderr', (data) => {
		logger.error(trim(data.toString()));
	});

	monitor.on('warn', (data) => {
		logger.warn(trim(data.toString()));
	});
}
