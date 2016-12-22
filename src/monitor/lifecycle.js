
import { getMonitorLogger } from '../utils/logger';
import { isFunction } from 'lodash';

export default function lifecycle(monitor, options) {
	const {
		name,
		onMonitorStart, onMonitorStop,
		onMonitorCrash, onMonitorSleep, onMonitorExit,
	} = options;
	const logger = getMonitorLogger();

	monitor.on('start', () => {
		isFunction(onMonitorStart) && onMonitorStart();
		logger.info(`${name} started.`);
	});

	monitor.on('stop', () => {
		isFunction(onMonitorStop) && onMonitorStop();
		logger.warn(`${name} stopped.`);
	});

	monitor.on('crash', () => {
		isFunction(onMonitorCrash) && onMonitorCrash();
		logger.fatal(`${name} crashed.`);
	});

	monitor.on('sleep', () => {
		isFunction(onMonitorSleep) && onMonitorSleep();
		logger.warn(`${name} sleeped.`);
	});

	monitor.on('exit', async (code, signal) => {
		isFunction(onMonitorExit) && onMonitorExit(code, signal);
		logger.debug(`${name} exit with code "${code}", signal "${signal}".`);
	});

	monitor.start();
}
