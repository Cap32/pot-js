import importFile from 'import-file';
import { logger, setLoggers } from 'pot-logger';
import { serialize } from '../utils/serialize';
import watch from '../utils/watch';
import { stopServer } from '../utils/unixDomainSocket';
import { once } from 'lodash';
import { signals } from 'signal-exit';

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';

export default function lifecycle(monitor, options) {
	const {
		name,
		events,
		inject,
		watch: watchOptions,
		monitorProcessTitle,
		baseDir: cwd,
	} = options;

	const handle = (modulePath, ...args) => {
		if (!modulePath) {
			return;
		}

		try {
			const handler = importFile(modulePath, { cwd });
			handler(...args);
		}
		catch (err) {
			logger.error(err.message);
			logger.debug(err);
		}
	};

	const logStart = () => {
		logger.info(`"${name}" started`);
	};
	const logStartOnce = once(logStart);

	monitor.on('start', () => {
		(isProd ? logStart : logStartOnce)();
		handle(events.start);
	});

	monitor.on('stop', () => {
		isProd && logger.warn(`"${name}" stopped`);
		handle(events.stop);
	});

	monitor.on('crash', () => {
		logger.fatal(`"${name}" crashed`);
		handle(events.crash);
	});

	monitor.on('sleep', () => {
		logger.warn(`"${name}" sleeped`);
		handle(events.sleep);
	});

	monitor.on('spawn', (child) => {
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
		logger.debug(`"${name}" exit with code "${code}", signal "${signal}"`);
		handle(events.exit, code, signal);
	});

	const exit = async () => {
		logger.debug('exit');
		await stopServer(name);
		monitor.stop(::process.exit);
	};

	signals().forEach((signal) => {
		process.on(signal, async () => {
			setLoggers('logLevel', 'OFF');
			await exit();
		});
	});

	process.title = monitorProcessTitle;

	process.on('uncaughtException', async (err) => {
		handle(events.uncaughtException, err);
		logger.debug('uncaughtException');
		logger.error(err);
		await exit();
	});

	watch({ cwd, ...watchOptions }, (file, stat) => {
		logger.info('restarted');
		logger.trace('watch:restart', stat);

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
