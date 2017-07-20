
// import respawn from 'respawn';
import respawn from './respawn';

import StdioIPC from '../utils/StdioIPC';
import { initMonitorLogger } from './monitorLogger';
import lifecycle from './lifecycle';
import logSystem from './logSystem';
import { startServer } from '../utils/unixDomainSocket';
import Bridge from '../Bridge';
import workspace from '../utils/workspace';
import { BRIDGE_EVENT_TYPE } from '../constants';
import stop from '../stop';

const potIPC = new StdioIPC(process);

const start = async (options) => {
	const {
		name, workspace: space,
		command, daemon, inject, force,
		env, configToEnv,
		...respawnOptions,
	} = options;

	const startSocketServer = async (monitor, name) => {
		try {
			const socketsDir = await workspace.getSocketsDir();
			const names = await Bridge.getNames();

			if (names.indexOf(name) > -1) {
				if (force) {
					await stop(options);
				}
				else {
					throw new Error(
						`Name "${name}" has already EXISTED. ` +
						'Please make sure if your program is NOT running, ' +
						'or use another name.\n' +
						`To stop "${name}", please run \`pot stop ${name}\``,
					);
				}
			}

			const socket = await startServer(name, socketsDir);

			socket.on(BRIDGE_EVENT_TYPE, (data, sock) => {
				const monitorState = monitor.toJSON();
				socket.emit(sock, BRIDGE_EVENT_TYPE, monitorState);
			});

			return true;
		}
		catch (err) {
			potIPC.send('error', err);
			return false;
		}
	};

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

	monitor.once('start', async () => {
		const success = await startSocketServer(monitor, name);
		if (success) { potIPC.send('start'); }
	});

	lifecycle(monitor, options);
	logSystem(monitor);
};

potIPC.on('start', start);
