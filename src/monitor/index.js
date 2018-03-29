// import respawn from 'respawn';
import respawn from './respawn';

import StdioIPC from '../utils/StdioIPC';
import { setLoggers } from 'pot-logger';
import lifecycle from './lifecycle';
import logSystem from './logSystem';
import Connection from '../Connection';
import workspace from '../utils/workspace';
import { stop } from '../stop';

const potIPC = new StdioIPC(process);

process.on('unhandledRejection', (reason, promise) => {
	console.warn('unhandledRejection: ' + reason);
	console.error(promise);
});

const start = async (options) => {
	const {
		name,
		workspace: space,
		logsDir,
		command,
		daemon,
		inject,
		force,
		env,
		configToEnv,
		...respawnOptions
	} = options;

	const startSocketServer = async (monitor, name) => {
		try {
			const names = await Connection.getNames();

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

			await Connection.serve(monitor);
			return true;
		}
		catch (err) {
			potIPC.send('error', err);
			return false;
		}
	};

	setLoggers({
		...options,
		enable: !daemon || logsDir,
		logsDir: logsDir || '.logs',
	});

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
		if (success) {
			potIPC.send('start');
		}
	});

	lifecycle(monitor, options);
	logSystem(monitor);
};

potIPC.on('start', start);
