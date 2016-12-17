
import logger from '../utils/logger';

export default function lifecycle(monitor, name) {
	monitor.on('start', () => {
		logger.info(`${name} started.`);
	});

	monitor.on('stop', () => {
		logger.info(`${name} stopped.`);
	});

	monitor.on('crash', () => {
		logger.info(`${name} crashed.`);
	});

	monitor.on('sleep', () => {
		logger.info(`${name} sleeped.`);
	});

	monitor.on('exit', async (code, signal) => {
		logger.info(`${name} exit with code "${code}", signal "${signal}".`);
	});

	monitor.start();
}
