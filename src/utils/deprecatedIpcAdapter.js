import { name as appspace } from '../../package.json';
import nodeIpc from 'node-ipc';
import { basename } from 'path';
import { DEPRECATED_BRIDGE, DEPRECATED_GET_INFO } from './SocketEventTypes';

export async function createClient(socketPath) {
	return new Promise((resolve, reject) => {
		Object.assign(nodeIpc.config, {
			appspace,
			silent: true,
			stopRetrying: true,
		});

		const serverId = basename(socketPath);
		nodeIpc.connectTo(serverId, socketPath, () => {
			const socket = nodeIpc.of[serverId];
			socket.on('connect', () => {
				socket.request = function request(eventType) {
					return new Promise((resolve) => {
						const handler = (data) => {
							socket.off(DEPRECATED_BRIDGE, handler);
							socket.off(DEPRECATED_GET_INFO, handler);
							resolve(data);
						};
						socket.on(DEPRECATED_BRIDGE, handler);
						socket.on(DEPRECATED_GET_INFO, handler);
						socket.emit(DEPRECATED_BRIDGE);
						socket.emit(DEPRECATED_GET_INFO);
					});
				};
				socket.close = function close() {
					return Promise.resolve(nodeIpc.disconnect(socket.id));
				};

				resolve(socket);
			});

			socket.once = socket.on.bind(socket);

			socket.on('error', reject);
		});
	});
}
