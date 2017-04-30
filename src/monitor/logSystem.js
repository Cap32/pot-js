
import { monitorLogger } from '../utils/logger';
import { trim } from 'lodash';

export default function logSystem(monitor) {
	monitor.on('stdout', (data) => {
		monitorLogger.info(trim(data.toString()));
	});

	monitor.on('stderr', (data) => {
		monitorLogger.error(trim(data.toString()));
	});

	monitor.on('warn', (data) => {
		monitorLogger.warn(trim(data.toString()));
	});
}
