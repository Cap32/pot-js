
import { spawn } from 'child_process';
import { resolve, sep } from 'path';
import StdioIPC from './utils/StdioIPC';
import { getPid, getPidFile, writePidFile } from './utils/pidHelper';
import workspace from './utils/workspace';
import logger, { setLevel } from './utils/logger';
import stop from './stop';
import { isNumber, isUndefined } from 'lodash';
import { Defaults } from './utils/resolveConfig';

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
	if (options.inspect) {
		if (options.inspect === 'true' || options.inspect === true) {
			options.inspect = '127.0.0.1:9229';
		}
		options.execArgs.push([`--inspect=${options.inspect}`]);
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

export default async function start(options = {}) {
	let monitorChild;

	try {
		const {
			root, name, entry, execCommand, execArgs, daemon, force, env,
		} = ensureOptions(options);

		setLevel(options.logLevel);

		logger.trace('logLevel', options.logLevel);

		workspace.set(options);

		const commandModulePath = resolve(root, entry);

		// throw error if `commandModulePath` is not exits.
		require.resolve(commandModulePath);

		options.command = [execCommand, commandModulePath, ...execArgs];

		logger.trace('command:', options.command);

		const pidFile = await getPidFile(name);

		const isExists = !!await getPid(pidFile, name);
		let isRestart = false;

		if (isExists) {
			if (force) {
				await stop(options);
				isRestart = true;
			}
			else { throw new Error(`"${name}" is running.`); }
		}

		const stdio = daemon ? 'ignore' : 'inherit';
		const { execPath } = process;
		const scriptFile = resolve(__dirname, '../bin/monitor');

		monitorChild = spawn(execPath, [scriptFile], {
			detached: daemon,
			stdio: ['ipc', stdio, stdio],
			cwd: root,
			env: {
				...process.env,
				...env,
			},
		});

		const { pid } = monitorChild;
		logger.debug('monitor pid:', pid);

		if (daemon) {
			await writePidFile(pidFile, pid);
		}

		const monitorIPC = new StdioIPC(monitorChild);

		logger.debug('name', options.name);

		monitorIPC
			.on('start', () => {
				logger.trace('monitor started');

				if (isRestart) {
					logger.info(`"${name}" restarted.`);
				}

				if (daemon) {
					monitorChild.disconnect();
					monitorChild.unref();
				}
			})
			.on('error', (err) => {
				logger.error(err.message);
				err.stack && logger.debug(err.stack);
				monitorChild.kill();
			})
			.send('start', { pidFile, ...options })
		;

		return monitorChild;
	}
	catch (err) {
		monitorChild && monitorChild.kill();
		throw err;
	}
}
