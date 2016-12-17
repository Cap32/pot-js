
import { getMonitorLogger } from '../utils/logger';

export default function lifecycle(monitor, name) {
	const logger = getMonitorLogger();

	monitor.on('start', () => {
		logger.info(`${name} started.`);
	});

	monitor.on('stop', () => {
		logger.warn(`${name} stopped.`);
	});

	monitor.on('crash', () => {
		logger.fatal(`${name} crashed.`);
	});

	monitor.on('sleep', () => {
		logger.warn(`${name} sleeped.`);
	});

	monitor.on('exit', async (code, signal) => {
		logger.debug(`${name} exit with code "${code}", signal "${signal}".`);
	});

	monitor.start();
}
