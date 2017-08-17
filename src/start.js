
import { spawn } from 'child_process';
import { resolve, sep } from 'path';
import StdioIPC from './utils/StdioIPC';
import workspace from './utils/workspace';
import { logger, setLoggers } from 'pot-logger';
import { isNumber, isUndefined } from 'lodash';
import { Defaults } from './utils/resolveConfig';
import chalk from 'chalk';
import PidManager from './utils/PidManager';

process.on('unhandledRejection', (r) => logger.debug(r));

const ensureName = (options) => {
	if (options.name) {
		if (isNumber(options.name)) { options.name += ''; }
		return options;
	}

	const { root } = options;

	try {
		const { name } = require(resolve(root, 'package.json'));
		if (!name) { throw new Error(); }
		options.name = name;
	}
	catch (err) {
		const sepRegExp = new RegExp(sep, 'g');
		options.name = root.replace(sepRegExp, '_');
	}
};

const ensureWatch = (options) => {
	if (!options.watch) { return options; }

	let { watch } = options;

	watch === true && (watch = { enable: true });

	options.watch = {
		ignoreDotFiles: watch.ignoreDotFiles || options.watchIgnoreDotFiles,
		dirs: watch.dirs || options.watchDirs,
		...watch,
	};

};

const ensureOptions = (options = {}) => {
	const cwd = process.cwd();
	options.root = resolve(cwd, (options.root || cwd));
	const logsDir = options.logsDir || Defaults.LOGS_DIR;
	options.logsDir = resolve(options.root, logsDir);
	options.execCommand = options.execCommand || Defaults.EXEC_COMMAND;
	options.execArgs = [].concat(options.execArgs || []);
	if (options.inspect === 'true' || options.inspect === true) {
		options.inspect = '127.0.0.1:9229';
	}
	else if (options.inspect === 'false') {
		delete options.inspect;
	}
	options.entry = options.entry || Defaults.ENTRY;
	options.logLevel = options.logLevel || Defaults.LOG_LEVEL;
	options.events = options.events || {};
	options.env = options.env || {};
	if (options.production) { options.env.NODE_ENV = 'production'; }
	if (isUndefined(options.maxRestarts)) {
		options.maxRestarts = options.production ? -1 : 0;
	}
	ensureName(options);
	ensureWatch(options);
	return options;
};

const execMonitorProc = ({ root, daemon, env }) => {
	const stdio = daemon ? 'ignore' : 'inherit';
	const { execPath } = process;
	const scriptFile = resolve(__dirname, '../bin/monitor');

	return spawn(execPath, [scriptFile], {
		detached: daemon,
		stdio: ['ipc', stdio, stdio],
		cwd: root,
		env: {
			...process.env,
			...env,
		},
	});
};

const getCommand = (options) => {
	const { root, entry, execCommand, execArgs, inspect } = options;

	const commandModulePath = resolve(root, entry);

	// throw error if `commandModulePath` is not exits.
	require.resolve(commandModulePath);

	const args = [commandModulePath, ...execArgs];
	if (inspect) { args.unshift(`--inspect=${inspect}`); }
	const command = [execCommand, ...args];
	logger.trace('command', chalk.gray(command.join(' ')));
	return command;
};

const connectMonitor = (monitorProc, options, pidManager) => {
	const ipc = new StdioIPC(monitorProc);
	const command = getCommand(options);
	const { pid } = monitorProc;
	logger.debug('monitor pid', chalk.magenta(pid));
	const { pidFile } = pidManager;

	return new Promise((resolve, reject) => {
		ipc
			.on('start', async () => {
				logger.trace('monitor started');

				if (pidManager.isRunning) {
					logger.info(`"${options.name}" restarted`);
				}

				if (options.daemon) {
					await pidManager.write(pid);
					monitorProc.disconnect();
					monitorProc.unref();
				}

				resolve();
			})
			.on('error', (err) => {
				monitorProc.kill();
				reject(err);
			})
			.send('start', { ...options, pidFile, command })
		;
	});
};

export default async function start(options = {}) {
	let monitorProc;

	try {
		const { name, force } = ensureOptions(options);

		setLoggers('logLevel', options.logLevel);
		logger.trace('logs dir', chalk.gray(options.logsDir));
		logger.trace('logLevel', options.logLevel);

		workspace.set(options);

		const pidManager = await PidManager.find(name);

		if (pidManager.isRunning) {
			if (force) { await pidManager.kill(); }
			else { throw new Error(`"${name}" is running.`); }
		}

		const monitorProc = execMonitorProc(options);
		await connectMonitor(monitorProc, options, pidManager);
		return monitorProc;
	}
	catch (err) {
		monitorProc && monitorProc.kill();
		throw err;
	}
}
