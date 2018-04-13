import spawn from 'cross-spawn';
import { resolve } from 'path';
import { ensureDir } from 'fs-extra';
import StdioIPC from './utils/StdioIPC';
import workspace from './utils/workspace';
import isWin from './utils/isWin';
import validateSchema from './utils/validateSchema';
import { logger, setLoggers } from 'pot-logger';
import { isNumber, isObject, isUndefined, noop } from 'lodash';
import chalk from 'chalk';
import Connection from './Connection';
import onExit from 'signal-exit';
import fkill from 'fkill';
import { version } from '../package.json';

const potjs = { version };

const ensureName = (options) => {
	if (options.name) {
		if (isNumber(options.name)) {
			options.name += '';
		}
		return options;
	}

	const { cwd } = options;

	try {
		const { name } = require(resolve(cwd, 'package.json'));
		if (!name) {
			throw new Error();
		}
		options.name = name;
	}
	catch (err) {
		const sepRegExp = new RegExp(isWin ? '\\\\' : '/', 'g');
		options.name = cwd.replace(sepRegExp, '_');
	}
};

const ensureWatch = (options) => {
	if (!options.watch) {
		options.watch = { enable: false };
		return options;
	}

	let { watch } = options;
	if (watch === true) {
		watch = { enable: true };
	}
	options.watch = {
		ignoreDotFiles: watch.ignoreDotFiles || options.watchIgnoreDotFiles,
		dirs: watch.dirs || options.watchDirs,
		...watch,
	};
};

const ensureOptions = (options = {}) => {
	validateSchema(options);

	options.cwd = resolve(options.cwd);

	// TODO: root is deprecated
	options.baseDir = resolve(options.cwd, options.root || options.baseDir);

	// DEPRECATED
	options.root = options.baseDir;

	if (options.logsDir) {
		options.logsDir = resolve(options.baseDir, options.logsDir);
	}

	options.execArgs = [].concat(options.execArgs || []);
	if (options.inspect === 'true' || options.inspect === true) {
		options.inspect = '127.0.0.1:9229';
	}
	else if (options.inspect === 'false') {
		delete options.inspect;
	}
	else if (isObject(options.inspect)) {
		const { port = 9229, host = '127.0.0.1' } = options.inspect;
		options.inspect = `${host}:${port}`;
	}
	options.events = options.events || {};
	if (options.production) {
		options.env.NODE_ENV = 'production';
	}
	if (isUndefined(options.maxRestarts)) {
		options.maxRestarts = options.production ? -1 : 0;
	}
	ensureName(options);
	ensureWatch(options);
	return options;
};

const startMonitorProc = ({ baseDir, daemon, env, name }) => {
	const stdio = daemon ? 'ignore' : 'inherit';
	const { execPath } = process;
	const scriptFile = resolve(__dirname, '../bin/monitor');

	const proc = spawn(execPath, [scriptFile], {
		detached: daemon,
		stdio: ['ipc', stdio, stdio],
		cwd: baseDir,
		env: {
			...process.env,
			...env,
		},
	});

	proc.originalKill = proc.kill;
	proc.kill = async () => {
		const connection = await Connection.getByName(name);
		if (connection) await connection.requestStopServer();
	};

	return proc;
};

const getCommand = (options) => {
	const { baseDir, entry, execCommand, execArgs, inspect } = options;

	const commandModulePath = resolve(baseDir, entry);

	// throw error if `commandModulePath` is not exits.
	require.resolve(commandModulePath);

	const args = [...execArgs, commandModulePath];
	if (inspect) {
		args.unshift(`--inspect=${inspect}`);
	}
	const command = [execCommand, ...args];
	logger.trace('command', chalk.gray(command.join(' ')));
	return command;
};

const connectMonitor = async (monitorProc, options, connection) => {
	const ipc = new StdioIPC(monitorProc);
	const command = getCommand(options);
	const { name, daemon } = options;
	const ppid = monitorProc.pid;
	logger.debug('monitor pid', chalk.magenta(ppid));
	const pidFile = await Connection.getPidFile(name);
	const socketPath = await Connection.getSocketPath(name);

	return new Promise((resolve, reject) => {
		ipc
			.on('start', () => {
				logger.trace('monitor started');

				if (connection) {
					logger.info(`"${name}" restarted`);
				}

				if (daemon) {
					monitorProc.disconnect();
					monitorProc.unref();
				}

				resolve();
			})
			.on('error', (err) => {
				monitorProc.kill();
				reject(err);
			})
			.send('start', {
				...options,
				parentPid: ppid,
				ppid,
				pidFile,
				socketPath,
				command,
				potjs,
			});
	});
};

export default async function start(options = {}) {
	let monitorProc;

	const kill = async () => {
		if (monitorProc) {
			await fkill(monitorProc.pid, { tree: true }).catch(noop);
		}
	};

	onExit(async () => {
		if (!options.daemon) {
			await kill();
		}
		process.exit();
	});

	try {
		const { name, force, baseDir } = ensureOptions(options);

		await ensureDir(baseDir);

		setLoggers('logLevel', options.logLevel);
		if (options.logsDir) {
			logger.trace('logs dir', chalk.gray(options.logsDir));
		}
		logger.trace('logLevel', options.logLevel);

		workspace.set(options);

		const connection = await Connection.getByName(name);

		if (connection) {
			if (force) {
				await connection.requestStopServer();
			}
			else {
				await connection.disconnect();
				throw new Error(`"${name}" is running.`);
			}
		}

		monitorProc = startMonitorProc(options);
		await connectMonitor(monitorProc, options, connection);
	}
	catch (err) {
		await kill();
		throw err;
	}

	return monitorProc;
}
