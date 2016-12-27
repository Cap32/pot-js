
import { getMonitorLogger } from '../utils/logger';
import importModule from '../utils/importModule';
import { serialize } from '../utils/serialize';
import watch from '../utils/watch';
import { setLevel } from '../utils/logger';
import { stopServer } from '../utils/unixDomainSocket';
import { once } from 'lodash';

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';

export default function lifecycle(monitor, options) {
	const { name, events, inject, watch: watchOptions } = options;
	const logger = getMonitorLogger();

	const handle = (modulePath, ...args) => {
		if (!modulePath) { return; }

		try {
			const handler = importModule(modulePath, options);
			handler(...args);
		}
		catch (err) {
			logger.error(err.message);
			logger.debug(err);
		}
	};

	const logStart = () => {
		logger.info(`${name} started.`);
	};
	const logStartOnce = once(logStart);

	monitor.on('start', () => {
		(isProd ? logStart : logStartOnce)();
		handle(events.start);
	});

	monitor.on('stop', () => {
		isProd && logger.warn(`${name} stopped.`);
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

		if (inject) {
			logger.trace('child.connected', child.connected);
			if (child.connected) {
				child.send(serialize(options));
				child.disconnect();
			}
		}
	});

	monitor.on('exit', async (code, signal) => {
		logger.debug(`${name} exit with code "${code}", signal "${signal}".`);
		handle(events.exit, code, signal);
	});

	const exit = () => {
		logger.debug('exit');
		stopServer();
		monitor.stop(::process.exit);
	};

	const silentExit = () => {
		setLevel('OFF');
		exit();
	};

	process.on('SIGINT', silentExit);
	process.on('SIGTERM', silentExit);
	process.on('uncaughtException', (err) => {
		handle(event.uncaughtException, err);
		logger.error(err);
		exit();
	});

	watch(watchOptions, (file, stat) => {
		logger.info('restart');
		logger.debug('watch:restart', stat);

		process.emit('watch:restart', { file, stat });
		handle(events.restart);

		return new Promise((resolve) => {
			monitor.stop(() => {
				monitor.start();
				resolve();
			});
		});
	});

	monitor.start();
}
