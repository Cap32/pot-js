import { ensureLogger, logger, setLoggers } from 'pot-logger';
import respawn, { EventTypes } from './utils/respawn';
import Connection from './Connection';
import workspace from './utils/workspace';
import watch from './utils/watch';
import onSignalExit from './utils/onSignalExit';
import createScriptRunner from './utils/createScriptRunner';
import chalk from 'chalk';

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';

if (!isProd) {
	process.on('unhandledRejection', (reason, promise) => {
		console.warn('unhandledRejection: ' + reason);
		console.error(promise);
	});
}

const globalState = { instancesCount: 0 };

const start = async function start(options) {
	const {
		name,
		workspace: space,
		logsDir,
		command,
		daemon,
		force,
		env,
		configToEnv,
		events,
		watch: watchOptions,
		monitorProcessTitle,
		baseDir: cwd,
		production,
		...respawnOptions
	} = options;

	setLoggers({
		...options,
		enable: !daemon || logsDir,
		logsDir: logsDir || '.logs',
	});

	workspace.set(space);
	process.title = monitorProcessTitle;

	const send = (type, payload) =>
		process.connected && process.send({ type, payload });

	const errors = [];

	const monitors = respawn(command, {

		// stdio: ['ignore', 'pipe', 'pipe'],
		...respawnOptions,
		data: options,
		globalState,
		env: (function () {
			const res = { ...env };
			if (!res.NODE_ENV) {
				res.NODE_ENV = production ? 'production' : 'development';
			}
			if (configToEnv) {
				res[configToEnv] = JSON.stringify(options);
			}
			return res;
		})(),
	});

	const eventsLogger = ensureLogger('events', 'gray');
	const runScript = createScriptRunner({ cwd, logger: eventsLogger });
	const runEvent = (event, ...args) => {
		const hook = events[event];
		if (hook) {
			const prefix = [event]
				.concat(args)
				.filter(Boolean)
				.join(' ');
			eventsLogger.info(chalk.gray(`${prefix} - ${hook}`));
			runScript(event, ...args);
		}
	};

	const bootstraps = monitors.map((monitor) => {
		let displayName = monitor.data.name;

		const exit = async () => {
			logger.debug('exit');
			try {
				const connection = await Connection.getByName(name);
				if (connection) {
					await connection.requestStopServer();
				}
				await monitor.stop();
			}
			catch (err) {
				logger.debug(err);
			}
			process.exit();
		};

		monitor.on(EventTypes.STOP, () => {
			logger.warn(`"${displayName}" stopped`);
			runEvent(EventTypes.STOP);
		});

		monitor.on(EventTypes.CRASH, () => {
			logger.fatal(`"${displayName}" crashed`);
			runEvent(EventTypes.CRASH);
		});

		monitor.on(EventTypes.SLEEP, () => {
			logger.warn(`"${displayName}" sleeped`);
			runEvent(EventTypes.SLEEP);
		});

		monitor.on(EventTypes.SPAWN, () => {
			runEvent(EventTypes.SPAWN);
		});

		monitor.on(EventTypes.EXIT, async (code, signal) => {
			logger.debug(
				`"${displayName}" exit with code "${code}", signal "${signal}"`,
			);
			runEvent(EventTypes.EXIT, code, signal);
		});

		monitor.on(EventTypes.STDOUT, (data) => {
			runEvent(EventTypes.STDOUT);
			logger.info(data.toString().trim());
		});

		monitor.on(EventTypes.STDERR, (data) => {
			runEvent(EventTypes.STDERR);
			logger.error(data.toString().trim());
		});

		monitor.on(EventTypes.WARN, (data) => {
			runEvent(EventTypes.WARN);
			logger.warn(data.toString().trim());
		});

		process.on('uncaughtException', async (err) => {
			logger.fatal(err);
			await exit();
		});

		onSignalExit(async () => {
			setLoggers('logLevel', 'OFF');
			await exit();
		});

		watch({ cwd, ...watchOptions }, async (file, stat) => {
			logger.trace('watch:restart', stat);
			process.emit('watch:restart', { file, stat });
			await monitor.restart();
		});

		monitor.on(EventTypes.RESTART, async () => {
			await Connection.writePid(monitor);
			logger.info(`"${displayName}" restarted`);
			runEvent(EventTypes.RESTART);
		});

		return new Promise((resolve) => {
			monitor.on(EventTypes.START, async () => {
				try {
					monitor.id = ++globalState.instancesCount;
					await Connection.serve(monitor);
					displayName = monitor.data.displayName;
					logger.info(`"${displayName}" started`);
					runEvent(EventTypes.START);
				}
				catch (err) {
					logger.debug(err);
					errors.push(err);
				}
				resolve();
			});
			monitor.start();
		});
	});

	await Promise.all(bootstraps);

	const success = bootstraps.length > errors.length;

	if (success) {
		send('start');
	}
	else {
		send('error', {
			errors: errors.map((err) => ({
				message: err.message,
				stack: err.stack,
			})),
		});
	}
};

process.on('message', (message) => {
	if (message.type === 'start') {
		start(message.payload);
	}
});
