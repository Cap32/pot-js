import { ensureLogger, logger, setLoggers } from 'pot-logger';
import respawn from './utils/respawn';
import StdioIPC from './utils/StdioIPC';
import Connection from './Connection';
import workspace from './utils/workspace';
import { serialize } from './utils/serialize';
import watch from './utils/watch';
import onSignalExit from './utils/onSignalExit';
import createScriptRunner from './utils/createScriptRunner';
import { once } from 'lodash';
import chalk from 'chalk';

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';
const potIPC = new StdioIPC(process);

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
		potIPC.send('error', err);
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
		inject,
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
		stdio: [inject ? 'ipc' : 'ignore', std, std],
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

	process.on('uncaughtException', async (err) => {
		runEvent('uncaughtException', err);
		logger.error(err);
		await exit();
	});

	monitor.once('start', async () => {
		logger.info(`"${name}" started`);
		const success = await startSocketServer(monitor);
		if (success) {
			potIPC.send('start');
		}
	});

	monitor.on('start', () => {
		runEvent('start');
	});

	monitor.on('stop', () => {
		isProd && logger.warn(`"${name}" stopped`);
		runEvent('stop');
	});

	monitor.on('crash', () => {
		logger.fatal(`"${name}" crashed`);
		runEvent('crash');
	});

	monitor.on('sleep', () => {
		logger.warn(`"${name}" sleeped`);
		runEvent('sleep');
	});

	monitor.on('spawn', (child) => {
		runEvent('spawn');

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
		runEvent('exit', code, signal);
	});

	monitor.on('stdout', (data) => {
		runEvent('stdout');
		logger.info(data.toString());
	});

	monitor.on('stderr', (data) => {
		runEvent('stderr');
		logger.error(data.toString());
	});

	monitor.on('warn', (data) => {
		runEvent('warn');
		logger.warn(data.toString());
	});

	onSignalExit(async () => {
		setLoggers('logLevel', 'OFF');
		await exit();
	});

	watch({ cwd, ...watchOptions }, async (file, stat) => {
		logger.info('restarted');
		logger.trace('watch:restart', stat);

		process.emit('watch:restart', { file, stat });
		runEvent('restart');

		await monitor.stop();
		monitor.start();
	});

	monitor.start();
};

potIPC.on('start', start);
