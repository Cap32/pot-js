
import { getMonitorLogger } from '../utils/logger';
import { isFunction } from 'lodash';

export default function lifecycle(monitor, options) {
	const {
		name,
		onMonitorStart, onMonitorStop,
		onMonitorCrash, onMonitorSleep,
		onMonitorExit, onMonitorSpawn,
	} = options;
	const logger = getMonitorLogger();

	monitor.on('start', () => {
		isFunction(onMonitorStart) && onMonitorStart(monitor);
		logger.info(`${name} started.`);
	});

	monitor.on('stop', () => {
		isFunction(onMonitorStop) && onMonitorStop(monitor);
		logger.warn(`${name} stopped.`);
	});

	monitor.on('crash', () => {
		isFunction(onMonitorCrash) && onMonitorCrash(monitor);
		logger.fatal(`${name} crashed.`);
	});

	monitor.on('sleep', () => {
		isFunction(onMonitorSleep) && onMonitorSleep(monitor);
		logger.warn(`${name} sleeped.`);
	});

	monitor.on('spawn', (child) => {
		isFunction(onMonitorSpawn) && onMonitorSpawn(monitor, child);
		logger.trace('spawn');
	});

	monitor.on('exit', async (code, signal) => {
		isFunction(onMonitorExit) && onMonitorExit(monitor, code, signal);
		logger.debug(`${name} exit with code "${code}", signal "${signal}".`);
	});

	monitor.start();
}
