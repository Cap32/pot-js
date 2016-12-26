
import { spawn } from 'child_process';
import { resolve, sep } from 'path';
import StdioIPC from './utils/StdioIPC';
import { getPid, getPidFile, writePidFile } from './utils/pidHelper';
import workspace from './utils/workspace';
import logger, { setLevel } from './utils/logger';
import stop from './stop';
import { Defaults } from './utils/resolveConfig';

const ensureName = (options) => {
	if (options.name) { return options; }

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
	options.entry = options.entry || Defaults.ENTRY;
	options.logLevel = options.logLevel || Defaults.LOG_LEVEL;
	options.events = options.events || {};
	options.env = options.env || {};
	if (options.production) { options.env.NODE_ENV = 'production'; }
	ensureName(options);
	ensureWatch(options);
	return options;
};

const start = async (options = {}) => {
	const {
		root, name, entry, execCommand, daemon, force,
	} = ensureOptions(options);

	setLevel(options.logLevel);

	logger.trace('logLevel', options.logLevel);

	workspace.set(options);

	const commandModulePath = resolve(root, entry);

	// throw error if `commandModulePath` is not exits.
	require.resolve(commandModulePath);

	options.command = [execCommand, commandModulePath];

	logger.trace('command:', options.command);

	const pidFile = await getPidFile(name);

	const isExists = !!await getPid(pidFile, name);

	if (isExists) {
		if (force) {
			logger.trace(`force stop "${name}"`);
			await stop(options);
			logger.trace(`"${name}" stopped.`);
		}
		else { throw new Error(`"${name}" is running.`); }
	}

	const stdio = daemon ? 'ignore' : 'inherit';
	const { execPath } = process;
	const scriptFile = resolve(__dirname, '../bin/monitor');
	const child = spawn(execPath, [scriptFile], {
		detached: daemon,
		stdio: ['ipc', stdio, stdio],
		cwd: root,
	});

	const childIPC = new StdioIPC(child);

	childIPC
		.on('pid', async (pid) => {
			if (daemon) {
				await writePidFile(pidFile, pid);
			}
		})
		.on('start', () => {
			logger.trace('monitor started');

			if (daemon) {
				child.disconnect();
				child.unref();
			}
		})
		.send('start', { pidFile, ...options })
	;

	return child;
};

export default start;
