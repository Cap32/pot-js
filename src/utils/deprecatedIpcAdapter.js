import { name as appspace } from '../../package.json';
import nodeIpc from 'node-ipc';
import { basename } from 'path';
import { DEPRECATED_BRIDGE, DEPRECATED_GET_INFO } from './SocketEventTypes';
import fkill from 'fkill';
import isWin from './isWin';

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
				socket.request = function request() {
					return new Promise((resolve) => {
						const handler = (res) => {
							socket.off(DEPRECATED_BRIDGE, handler);
							socket.off(DEPRECATED_GET_INFO, handler);

							if (res && res.data && res.started) {
								if (res.data) {
									const { data } = res;
									delete res.data;
									res.monitor = { ...res };
									Object.assign(res, data);
								}
								if (res.parentPid && !res.ppid) {
									res.ppid = res.parentPid;
								}
							}

							resolve(res);
						};
						socket.on(DEPRECATED_BRIDGE, handler);
						socket.on(DEPRECATED_GET_INFO, handler);
						socket.emit(DEPRECATED_BRIDGE);
						socket.emit(DEPRECATED_GET_INFO);
					});
				};
				socket.requestClose = async function requestClose() {
					const state = await socket.request();
					await fkill(state.parentPid, { force: isWin, tree: true });
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
