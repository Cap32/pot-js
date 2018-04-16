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
		...respawnOptions
	} = options;

	setLoggers({
		...options,
		enable: !daemon || logsDir,
		logsDir: logsDir || '.logs',
	});

	workspace.set(space);
	process.title = monitorProcessTitle;

	const std = daemon ? 'pipe' : 'inherit';
	const monitor = respawn(command, {
		stdio: ['ignore', std, std],
		...respawnOptions,
		data: options,
		env: configToEnv ? { ...env, [configToEnv]: JSON.stringify(options) } : env,
	});

	const eventsLogger = ensureLogger('events', 'gray');
	const runScript = createScriptRunner({ cwd, logger: eventsLogger });
	const runEvent = (event, ...args) => {
		const command = events[event];
		if (command) {
			const prefix = [event]
				.concat(args)
				.filter(Boolean)
				.join(' ');
			eventsLogger.info(chalk.gray(`${prefix} - ${command}`));
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

	monitor.once(EventTypes.START, async () => {
		logger.info(`"${name}" started`);
		const success = await startSocketServer(monitor);
		if (success) {
			process.send({ type: 'start' });
		}
	});

	monitor.on(EventTypes.START, () => {
		runEvent(EventTypes.START);
	});

	monitor.on(EventTypes.STOP, () => {
		isProd && logger.warn(`"${name}" stopped`);
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
		logger.info(data.toString());
	});

	monitor.on(EventTypes.STDERR, (data) => {
		runEvent(EventTypes.STDERR);
		logger.error(data.toString());
	});

	monitor.on(EventTypes.WARN, (data) => {
		runEvent(EventTypes.WARN);
		logger.warn(data.toString());
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
		logger.info('restarted');
		logger.trace('watch:restart', stat);

		process.emit('watch:restart', { file, stat });
		runEvent(EventTypes.RESTART);

		await monitor.stop();
		monitor.start();
	});

	monitor.start();
};

process.on('message', (message) => {
	if (message.type === 'start') {
		start(message.payload);
	}
});
