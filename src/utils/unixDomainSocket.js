
import { unlink } from 'fs-promise';
import ipc from 'node-ipc';
import { join } from 'path';
import logger from './logger';
import { name as appspace } from '../../package.json';

export const startServer = (id, socketsDir) => {
	return new Promise((resolve) => {
		Object.assign(ipc.config, {
			appspace,
			id,
			silent: true,
			stopRetrying: true,
		});

		const path = join(socketsDir, id);

		ipc.serve(path, () => {
			const { server } = ipc;

			server.on('error', (err) => {
				logger.error('server socket error', err);
			});

			resolve(server);
		});
		ipc.server.start();
	});
};

export const stopServer = () => ipc.server && ipc.server.stop();

export const startClient = (clientId, serverId, path) => {
	return new Promise((resolve) => {
		Object.assign(ipc.config, {
			appspace,
			id: clientId,
			silent: true,
			stopRetrying: true,
		});

		ipc.connectTo(serverId, path, () => {
			const socket = ipc.of[serverId];
			socket.on('connect', () => {
				resolve(socket);
			});

			socket.on('error', async (err) => {
				logger.debug('socket error', err);
				console.log('socket error', err);
				if (err && err.code === 'ECONNREFUSED') {
					await unlink(path);
				}
				resolve();
			});
		});
	});
};

export const disconnect = ::ipc.disconnect;
