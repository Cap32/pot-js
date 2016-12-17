
import { spawn } from 'child_process';
import { resolve, sep } from 'path';
import StdioIPC from './utils/StdioIPC';
import { getPid, getPidFile, writePidFile } from './utils/pidHelper';
import setUpWorkspace from './utils/setUpWorkspace';
import stop from './stop';

const ensureName = (options = {}) => {
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

const ensureOptions = (options = {}) => {
	const cwd = process.cwd();
	options.root = resolve(cwd, (options.root || cwd));
	const logsDir = options.logsDir || '.logs';
	options.logsDir = resolve(options.root, logsDir);
	options.logLevel = 'INFO';
	options.watch = options.watch || {};
	options.env = options.env || {};
	if (options.production) { options.env.NODE_ENV = 'production'; }
	return setUpWorkspace(ensureName(options));
};

const start = async (options = {}) => {
	const {
		root, name, entry, execCommand, daemon, force,
	} = ensureOptions(options);

	options.command = [execCommand, resolve(root, entry)];

	const pidFile = await getPidFile(name);

	const isExists = !!await getPid(pidFile, name);

	if (isExists) {
		if (force) { await stop(options); }
		else { throw new Error(`"${name}" is running.`); }
	}

	const stdio = daemon ? 'ignore' : 'inherit';
	const { execPath } = process;
	const scriptFile = resolve(__dirname, '../bin/monitor');
	const monitor = spawn(execPath, [scriptFile], {
		detached: daemon,
		stdio: ['ipc', stdio, stdio],
		cwd: root,
	});

	const ipc = new StdioIPC(monitor);

	ipc
		.on('pid', async (pid) => {
			if (daemon) {
				await writePidFile(pidFile, pid);
			}
		})
		.on('start', () => {
			monitor.emit('start');

			if (daemon) {
				monitor.disconnect();
				monitor.unref();
			}
		})
		.send('start', { pidFile, ...options })
	;

	return monitor;
};

export default start;
