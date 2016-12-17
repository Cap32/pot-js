
import { spawn } from 'child_process';
import { resolve } from 'path';
import StdioIPC from './utils/StdioIPC';
import { getPid, getPidFile, writePidFile } from './utils/pidHelper';
import { ensureName, setUpWorkspace } from './utils/config';

const ensureOptions = (options = {}) => {
	options.root = options.root || process.cwd();
	const logsDir = options.logsDir || '.logs';
	options.logsDir = resolve(options.root, logsDir);
	options.logLevel = 'INFO';
	options.watch = options.watch || {};
	return setUpWorkspace(ensureName(options));
};

const start = async (options = {}) => {
	const {
		root, name, command, execCommand, daemon,
	} = ensureOptions(options);

	options.command = [execCommand, resolve(root, command)];

	const pidFile = await getPidFile(name);

	const isExists = !!await getPid(pidFile, name);

	if (isExists) {
		throw new Error(`"${name}" is running.`);
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
