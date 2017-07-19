
import { unlink } from 'fs-extra';
import ipc from 'node-ipc';
import { join } from 'path';
import { logger } from './logger';
import { name as appspace } from '../../package.json';

export const startServer = (id, socketsDir) => {
	const path = join(socketsDir, id);
	return new Promise((resolve) => {
		Object.assign(ipc.config, {
			appspace,
			id,
			silent: true,
			stopRetrying: true,
		});

		ipc.serve(path, () => {
			const { server } = ipc;

			server.on('error', (err) => {
				logger.error(err.message);
				logger.debug(err);
			});

			resolve(server);
		});
		ipc.server.start();
	});
};

export const stopServer = () => ipc.server && ipc.server.stop();

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
