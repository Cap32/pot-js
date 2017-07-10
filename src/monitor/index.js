
import respawn from 'respawn';
import StdioIPC from '../utils/StdioIPC';
import { initMonitorLogger } from '../utils/logger';
import lifecycle from './lifecycle';
import logSystem from './logSystem';
import { startServer } from '../utils/unixDomainSocket';
import workspace from '../utils/workspace';
import { createAPIServer } from './api';

const potIPC = new StdioIPC(process);

const startSocketServer = async (monitor, name) => {
	const socketsDir = await workspace.getSocketsDir();
	const socketServer = await startServer(name, socketsDir);
	createAPIServer(monitor, socketServer);
};

const start = async (options) => {
	const {
		name, workspace: space,
		command, daemon, inject,
		env, configToEnv,
		...respawnOptions,
	} = options;

	await initMonitorLogger(options);

	workspace.set(space);

	const std = daemon ? 'pipe' : 'inherit';

	const monitor = respawn(command, {
		stdio: [inject ? 'ipc' : 'ignore', std, std],
		...respawnOptions,
		data: {
			...options,
			parentPid: process.pid,
		},
		env: configToEnv ? { ...env, [configToEnv]: JSON.stringify(options) } : env,
	});

	monitor.once('start', () => {
		startSocketServer(monitor, name);
		potIPC.send('start');
	});

	lifecycle(monitor, options);
	logSystem(monitor);
};

potIPC.on('start', start);
