
// import respawn from 'respawn';
import respawn from './respawn';

import StdioIPC from '../utils/StdioIPC';
import { initMonitorLogger } from '../utils/logger';
import lifecycle from './lifecycle';
import logSystem from './logSystem';
import { startServer } from '../utils/unixDomainSocket';
import workspace from '../utils/workspace';
import { BRIDGE_EVENT_TYPE } from '../constants';

const potIPC = new StdioIPC(process);

const startSocketServer = async (monitor, name) => {
	const socketsDir = await workspace.getSocketsDir();
	const socket = await startServer(name, socketsDir);
	socket.on(BRIDGE_EVENT_TYPE, (data, sock) => {
		const monitorState = monitor.toJSON();
		socket.emit(sock, BRIDGE_EVENT_TYPE, monitorState);
	});
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
