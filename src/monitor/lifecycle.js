
import { getMonitorLogger } from '../utils/logger';
import { join } from 'path';

export default function lifecycle(monitor, options) {
	const { name, events, root } = options;
	const logger = getMonitorLogger();

	const handle = (modulePath, ...args) => {
		if (!modulePath) { return; }

		try {
			require(join(root, modulePath))(...args);
		}
		catch (err) {
			logger.error(err.message);
			logger.debug(err);
		}
	};

	monitor.on('start', () => {
		logger.info(`${name} started.`);
		handle(events.start);
	});

	monitor.on('stop', () => {
		logger.warn(`${name} stopped.`);
		handle(events.stop);
	});

	monitor.on('crash', () => {
		logger.fatal(`${name} crashed.`);
		handle(events.crash);
	});

	monitor.on('sleep', () => {
		logger.warn(`${name} sleeped.`);
		handle(events.sleep);
	});

	monitor.on('spawn', (child) => {
		logger.trace('spawn');
		handle(events.spawn, child);
	});

	monitor.on('exit', async (code, signal) => {
		logger.debug(`${name} exit with code "${code}", signal "${signal}".`);
		handle(events.exit, code, signal);
	});

	monitor.start();
}
