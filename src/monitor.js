import { ensureLogger, logger, setLoggers } from 'pot-logger';
import respawn, { EventTypes } from './utils/respawn';
import Connection from './Connection';
import workspace from './utils/workspace';
import watch from './utils/watch';
import onSignalExit from './utils/onSignalExit';
import createScriptRunner from './utils/createScriptRunner';
import chalk from 'chalk';
import { resolve } from 'path';

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';

if (!isProd) {
	process.on('unhandledRejection', (reason, promise) => {
		console.warn('unhandledRejection: ' + reason);
		console.error(promise);
	});
}

const startSocketServer = async function startSocketServer(monitor) {
	try {
		await Connection.serve(monitor);
		return true;
	}
	catch (err) {
		process.send({ type: 'error', payload: err });
		return false;
	}
};

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

	const monitor = respawn(command, {
		stdio: ['ignore', 'pipe', 'pipe'],
		...respawnOptions,
		fork: false,
		data: options,
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

	const exit = async () => {
		logger.debug('exit');
		const connection = await Connection.getByName(name);
		if (connection) {
			await connection.requestStopServer();
		}
		await monitor.stop();
		process.exit();
	};

	monitor.on(EventTypes.START, async () => {
		const success = await startSocketServer(monitor);
		if (success) {
			process.send({ type: 'start' });
		}
		logger.info(`"${name}" started`);
		runEvent(EventTypes.START);
	});

	monitor.on(EventTypes.RESTART, () => {
		logger.info(`"${name}" restarted`);
		runEvent(EventTypes.RESTART);
	});

	monitor.on(EventTypes.STOP, () => {
		logger.warn(`"${name}" stopped`);
		runEvent(EventTypes.STOP);
	});

	monitor.on(EventTypes.CRASH, () => {
		logger.fatal(`"${name}" crashed`);
		runEvent(EventTypes.CRASH);
	});

	monitor.on(EventTypes.SLEEP, () => {
		logger.warn(`"${name}" sleeped`);
		runEvent(EventTypes.SLEEP);
	});

	monitor.on(EventTypes.SPAWN, () => {
		runEvent(EventTypes.SPAWN);
	});

	monitor.on(EventTypes.EXIT, async (code, signal) => {
		logger.debug(`"${name}" exit with code "${code}", signal "${signal}"`);
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

	monitor.start();
};

process.on('message', (message) => {
	if (message.type === 'start') {
		start(message.payload);
	}
});
