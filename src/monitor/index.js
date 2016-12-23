
import respawn from 'respawn';
import StdioIPC from '../utils/StdioIPC';
import watch from '../utils/watch';
import { getMonitorLogger, setMonitorLogger } from '../utils/logger';
import lifecycle from './lifecycle';
import logSystem from './logSystem';
import { startServer, stopServer } from '../utils/unixDomainSocket';
import workspace from '../utils/workspace';
import { createAPIServer } from './api';
import { omit } from 'lodash';

const parentIPC = new StdioIPC(process);

const startSocketServer = async (monitor, name) => {
	const socketsDir = await workspace.getSocketsDir();
	const socket = await startServer(name, socketsDir);
	createAPIServer(monitor, socket);
};

const start = (options) => {
	const { name } = options;
	const {
		watch: watchOptions, workspace: space,
		command, logsDir, env,
		...respawnOptions,
	} = options;

	const logger = getMonitorLogger();

	workspace.set(space);

	const monitor = respawn(command, {
		...respawnOptions,
		env: {
			...env,
			POT_CONFIG: JSON.stringify(omit(options, ['env'])),
		},
		data: {
			parentPid: process.pid,
			logsDir,
		},
	});

	monitor.once('start', () => {
		startSocketServer(monitor, name);
		parentIPC.send('start');
	});

	lifecycle(monitor, options);
	logSystem(monitor);

	const exit = () => {
		logger.debug('exit');
		stopServer();
		monitor.stop(::process.exit);
	};

	process.on('SIGINT', exit);
	process.on('SIGTERM', exit);
	process.on('uncaughtException', (err) => {
		logger.error(err);
		exit();
	});

	watch(watchOptions, (file, stat) => {
		logger.debug('watch:restart', stat);

		process.emit('watch:restart', { file, stat });

		return new Promise((resolve) => {
			monitor.stop(() => {
				monitor.start();
				resolve();
			});
		});
	});
};

parentIPC.on('start', async (options) => {
	const { pid } = process;
	const logger = await setMonitorLogger(options);
	logger.debug('pid', pid);
	parentIPC.send('pid', pid);
	start(options);
});
