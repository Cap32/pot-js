
import respawn from 'respawn';
import StdioIPC from './utils/StdioIPC';
import watch from './utils/watch';
import formatBytes from './utils/formatBytes';
import logger from './utils/logger';
import { startServer, stopServer } from './utils/unixDomainSocket';
import workspace from './utils/workspace';
import pidUsage from 'pidusage';

const ipc = new StdioIPC(process);

const startSocketServer = async (monitor, name) => {
	const socketsDir = await workspace.getSocketsDir();
	const socket = await startServer(name, socketsDir);

	socket.on('info', (data, sock) => {
		const emit = (data = {}) => socket.emit(sock, 'info', {
			memoryUsage: {
				percent: '-',
				formattedHeapUsed: '-',
			},
			...monitor.toJSON(),
			...data,
		});

		const { pid } = monitor;
		if (pid) {
			pidUsage.stat(pid, (err, { memory }) => {
				let resp = null;
				if (err) { logger.error(err); }
				else {
					const { heapTotal } = process.memoryUsage();
					resp = {
						memoryUsage: {
							percent: `${(memory / heapTotal / 100).toFixed(2)}%`,
							formattedHeapUsed: formatBytes(memory),
						},
					};
				}
				emit(resp);
			});
			pidUsage.unmonitor(pid);
		}
		else {
			emit();
		}

	});
};

const lifecycle = (monitor, name) => {
	monitor.on('start', () => {
		logger.info(`${name} started.`);
		ipc.send('start');
	});

	monitor.on('stop', () => {
		logger.info(`${name} stopped.`);
	});

	monitor.on('crash', () => {
		logger.info(`${name} crashed.`);
	});

	monitor.on('sleep', () => {
		logger.info(`${name} sleeped.`);
	});

	monitor.on('exit', async (code, signal) => {
		logger.info(`${name} exit with code "${code}", signal "${signal}".`);
	});

	monitor.on('stdout', (data) => {
		logger.info(`${name} stdout: ${data}`);
	});

	monitor.on('stderr', (data) => {
		logger.error(`${name} stderr: ${data}`);
	});

	monitor.on('warn', (data) => {
		logger.warn(`${name} warn: ${data}`);
	});

	monitor.start();
};

const start = (options) => {
	const { name } = options;
	const {
		watch: watchOptions, workspace: space,
		port, logsDir, command,
		...respawnOptions,
	} = options;

	workspace.set(space);

	const monitor = respawn(command, {
		...respawnOptions,
		stdio: ['ignore', 'inherit', 'inherit'],
		data: {
			port,
			logsDir,
			pid: process.pid,
		},
	});

	lifecycle(monitor, name);

	startSocketServer(monitor, name);

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

ipc.on('start', (options) => {
	const { pid } = process;
	logger.debug('pid', pid);
	ipc.send('pid', pid);
	start(options);
});
