
import { remove, writeFileSync } from 'fs-extra';
import ipc from 'node-ipc';
import { join } from 'path';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import { name as appspace } from '../../package.json';
import workspace from './workspace';
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

export const stopServer = async (name) => {
	if (isWin) {
		const dir = await workspace.getSocketsDir();
		await remove(join(dir, name));
	}

	if (ipc.server) {
		ipc.server.stop();
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
				if (err && ['ECONNREFUSED', 'ENOENT'].indexOf(err.code) > -1) {
					await remove(path);
				}
				else {
					logger.error('socket error', err);
				}
				resolve();
			});
		});
	});
};

export const disconnect = ::ipc.disconnect;
