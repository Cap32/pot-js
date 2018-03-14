import { remove, writeFile } from 'fs-extra';
import { createServer, createClient } from './ipc';
import { join } from 'path';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import workspace from './workspace';
import isWin from './isWin';
import { BRIDGE_CLOSE } from '../constants';

export async function startServer(id) {
	const socketsDir = await workspace.getSocketsDir();
	const path = join(socketsDir, id);

	logger.trace('unix domain socket path', chalk.gray(path));

	if (isWin) {
		await writeFile(path);
	}

	const server = await createServer(path);
	server.reply(BRIDGE_CLOSE, async () => {
		await server.close();
	});
	return server;

	// return new Promise((resolve) => {
	// 	Object.assign(ipc.config, {
	// 		appspace,
	// 		id,
	// 		silent: true,
	// 		stopRetrying: true,
	// 	});

	// 	ipc.serve(path, () => {
	// 		const { server } = ipc;

	// 		if (isWin) {
	// 			writeFileSync(path);
	// 		}

	// 		server.on('error', (err) => {
	// 			logger.error(err.message);
	// 			logger.debug(err);
	// 		});

	// 		resolve(server);
	// 	});
	// 	ipc.server.start();
	// });
}

export async function stopServer(id) {
	const socketsDir = await workspace.getSocketsDir();
	const path = join(socketsDir, id);
	if (isWin) {
		await remove(path);
	}
	const client = await createClient(path);
	await client.request(BRIDGE_CLOSE);
}

export async function startClient(id) {
	const socketsDir = await workspace.getSocketsDir();
	const path = join(socketsDir, id);
	try {
		return await createClient(path);
	}
	catch (err) {
		if (err && ~['ECONNRESET', 'ECONNREFUSED', 'ENOENT'].indexOf(err.code)) {
			await remove(path);
		}
		else {
			logger.error('socket error', err);
		}
	}

	// return new Promise((resolve) => {
	// 	Object.assign(ipc.config, {
	// 		appspace,
	// 		id: clientId,
	// 		silent: true,
	// 		stopRetrying: true,
	// 	});

	// 	const path = join(socketsDir, serverId);

	// 	ipc.connectTo(serverId, path, () => {
	// 		const socket = ipc.of[serverId];
	// 		socket.on('connect', () => {
	// 			resolve(socket);
	// 		});

	// 		socket.on('error', async (err) => {
	// 			if (err && ['ECONNREFUSED', 'ENOENT'].indexOf(err.code) > -1) {
	// 				await remove(path);
	// 			}
	// 			else {
	// 				logger.error('socket error', err);
	// 			}
	// 			resolve();
	// 		});
	// 	});
	// });
}

// export const disconnect = ::ipc.disconnect;
