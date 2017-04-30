
import { monitorLogger, setLevel } from '../utils/logger';
import importModule from '../utils/importModule';
import { serialize } from '../utils/serialize';
import watch from '../utils/watch';
import { stopServer } from '../utils/unixDomainSocket';
import { once } from 'lodash';

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';

export default function lifecycle(monitor, options) {
	const { name, events, inject, watch: watchOptions } = options;

	const handle = (modulePath, ...args) => {
		if (!modulePath) { return; }

		try {
			const handler = importModule(modulePath, options);
			handler(...args);
		}
		catch (err) {
			monitorLogger.error(err.message);
			monitorLogger.debug(err);
		}
	};

	const logStart = () => {
		monitorLogger.info(`${name} started.`);
	};
	const logStartOnce = once(logStart);

	monitor.on('start', () => {
		(isProd ? logStart : logStartOnce)();
		handle(events.start);
	});

	monitor.on('stop', () => {
		isProd && monitorLogger.warn(`${name} stopped.`);
		handle(events.stop);
	});

	monitor.on('crash', () => {
		monitorLogger.fatal(`${name} crashed.`);
		handle(events.crash);
	});

	monitor.on('sleep', () => {
		monitorLogger.warn(`${name} sleeped.`);
		handle(events.sleep);
	});

	monitor.on('spawn', (child) => {
		monitorLogger.trace('spawn');
		handle(events.spawn, child);

		if (inject) {
			monitorLogger.trace('child.connected', child.connected);
			if (child.connected) {
				child.send(serialize(options));
				child.disconnect();
			}
		}
	});

	monitor.on('exit', async (code, signal) => {
		monitorLogger.debug(
			`${name} exit with code "${code}", signal "${signal}".`
		);
		handle(events.exit, code, signal);
	});

	const exit = () => {
		monitorLogger.debug('exit');
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
		monitorLogger.debug('uncaughtException');
		monitorLogger.error(err);
		exit();
	});

	watch(watchOptions, (file, stat) => {
		monitorLogger.info('restart');
		monitorLogger.debug('watch:restart', stat);

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
