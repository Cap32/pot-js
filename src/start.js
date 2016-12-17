
import { spawn } from 'child_process';
import { resolve } from 'path';
import StdioIPC from './utils/StdioIPC';
import { getPid, getPidFile, writePidFile } from './utils/pidHelper';
import {
	ensureName, ensureRoot, ensureWatch, setUpWorkspace,
} from './utils/config';
import { flow } from 'lodash/fp';

const start = async (options = {}) => {
	const merge = flow([
		ensureRoot, ensureName, ensureWatch, setUpWorkspace,
	]);

	const {
		root, name, command, execCommand, daemon,
	} = merge(options);

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
