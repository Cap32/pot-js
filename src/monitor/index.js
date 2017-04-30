
import respawn from 'respawn';
import StdioIPC from '../utils/StdioIPC';
import { initMonitorLogger } from '../utils/logger';
import lifecycle from './lifecycle';
import logSystem from './logSystem';
import { startServer } from '../utils/unixDomainSocket';
import workspace from '../utils/workspace';
import { createAPIServer } from './api';

const parentIPC = new StdioIPC(process);

const startSocketServer = async (monitor, name) => {
	const socketsDir = await workspace.getSocketsDir();
	const socket = await startServer(name, socketsDir);
	createAPIServer(monitor, socket);
};

const start = (options) => {
	const {
		name, workspace: space,
		command, daemon, inject,
		...respawnOptions,
	} = options;

	workspace.set(space);

	const std = daemon ? 'pipe' : 'inherit';

	const monitor = respawn(command, {
		stdio: [inject ? 'ipc' : 'ignore', std, std],
		...respawnOptions,
		data: {
			...options,
			parentPid: process.pid,
		},
	});

	monitor.once('start', () => {
		startSocketServer(monitor, name);
		parentIPC.send('start');
	});

	lifecycle(monitor, options);
	logSystem(monitor);
};

parentIPC.on('start', async (options) => {
	const { pid } = process;
	const logger = await initMonitorLogger(options);
	logger.debug('pid', pid);
	parentIPC.send('pid', pid);
	start(options);
});
