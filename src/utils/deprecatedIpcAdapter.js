import { name as appspace } from '../../package.json';
import nodeIpc from 'node-ipc';
import { basename } from 'path';
import fkill from 'fkill';
import isWin from './isWin';
import delay from 'delay';
import { logger } from 'pot-logger';

const DEPRECATED_BRIDGE = 'bridge';
const DEPRECATED_GET_INFO = 'getInfo';

export async function createClient(socketPath) {
	const timeoutPromise = delay(30000);
	const createTimeout = async () => {
		await timeoutPromise;
		throw new Error('TIMEOUT');
	};

	const createClientPromise = new Promise((resolve, reject) => {
		Object.assign(nodeIpc.config, {
			appspace,
			silent: true,
			stopRetrying: true,
		});

		const serverId = basename(socketPath);
		nodeIpc.connectTo(serverId, socketPath, () => {
			const socket = nodeIpc.of[serverId];
			socket.on('connect', () => {
				let parentPid;

				socket.send = function send(event, data) {
					if (data && data.method === 'requestShutDown') {
						if (parentPid) {
							fkill(parentPid, { force: isWin, tree: true });
						}
						else {
							logger.error('Could not shut down');
						}
					}
					else {
						socket.emit(DEPRECATED_BRIDGE);
						socket.emit(DEPRECATED_GET_INFO);
					}
				};

				socket.dataOnce = function dataOnce(event, callback) {
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
							if (res.ppid) parentPid = res.ppid;
						}

						callback(res);
					};
					socket.on(DEPRECATED_BRIDGE, handler);
					socket.on(DEPRECATED_BRIDGE, handler);
				};

				socket.close = function disconnect() {
					nodeIpc.disconnect(socket.id);
				};

				resolve(socket);
			});

			socket.once = socket.on.bind(socket);

			socket.on('error', reject);
		});
	});

	try {
		const res = await Promise.race([createClientPromise, createTimeout()]);
		timeoutPromise.cancel();
		return res;
	}
	catch (err) {
		timeoutPromise.cancel();
		throw err;
	}
}
