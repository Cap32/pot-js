import { name as appspace } from '../../package.json';
import nodeIpc from 'node-ipc';
import { basename } from 'path';
import delay from 'delay';

export function createClient(socketPath) {
	return new Promise((resolve, reject) => {
		Object.assign(nodeIpc.config, {
			appspace,

			// id: 'monitor',
			silent: true,
			stopRetrying: true,
		});

		const serverId = basename(socketPath);
		nodeIpc.connectTo(serverId, socketPath, () => {
			const socket = nodeIpc.of[serverId];
			socket.on('connect', () => {
				setTimeout(() => {
					resolve(socket);
				}, 500);
			});

			socket.on('error', async (err) => {
				reject(err);
			});
		});
	});
}
