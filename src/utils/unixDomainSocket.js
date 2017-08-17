
import { unlink, writeFileSync } from 'fs-extra';
import ipc from 'node-ipc';
import { join } from 'path';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import { name as appspace } from '../../package.json';
import isWin from './isWin';

export const startServer = (id, socketsDir) => {
	const path = join(socketsDir, id);
	return new Promise((resolve) => {
		Object.assign(ipc.config, {
			appspace,
			id,
			silent: true,
			stopRetrying: true,
		});

		logger.trace('unix domain socket path', chalk.gray(path));

		ipc.serve(path, () => {
			const { server } = ipc;

			if (isWin) {
				writeFileSync(path);
			}

			server.on('error', (err) => {
				logger.error(err.message);
				logger.debug(err);
			});

			resolve(server);
		});
		ipc.server.start();
	});
};

export const stopServer = () => {
	if (ipc.server) {
		ipc.server.stop();
		if (isWin && ipc.server.path) {
			unlink(ipc.server.path);
		}
	}
};

export const startClient = (clientId, serverId, socketsDir) => {
	return new Promise((resolve) => {
		Object.assign(ipc.config, {
			appspace,
			id: clientId,
			silent: true,
			stopRetrying: true,
		});

		const path = join(socketsDir, serverId);

		ipc.connectTo(serverId, path, () => {
			const socket = ipc.of[serverId];
			socket.on('connect', () => {
				resolve(socket);
			});

			socket.on('error', async (err) => {
				logger.debug('socket error', err);
				if (err && err.code === 'ECONNREFUSED') {
					await unlink(path);
				}
				resolve();
			});
		});
	});
};

export const disconnect = ::ipc.disconnect;
