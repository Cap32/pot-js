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
			if (socket.hasConnected) return resolve(socket);

			socket.hasConnected = true;

			socket.on('connect', () => {
				let parentPid;

				socket.send = function send(method, args, reply) {
					if (method === 'shutDown') {
						const logError = () => logger.error('Could not shut down');
						if (parentPid) {
							fkill(parentPid, { force: isWin, tree: true }).catch(logError);
						}
						else {
							logError();
						}
					}
					else {
						const handler = (state) => {
							socket.off(DEPRECATED_BRIDGE, handler);
							socket.off(DEPRECATED_GET_INFO, handler);

							if (state && state.data && state.started) {
								if (state.data) {
									const { data } = state;
									delete state.data;
									state.monitor = { ...state };
									Object.assign(state, data);
								}
								if (state.parentPid && !state.ppid) {
									state.ppid = state.parentPid;
								}
								if (state.ppid) parentPid = state.ppid;
							}

							reply({ stateList: [state] });
						};
						socket.on(DEPRECATED_BRIDGE, handler);
						socket.on(DEPRECATED_GET_INFO, handler);

						socket.emit(DEPRECATED_BRIDGE, args);
						socket.emit(DEPRECATED_GET_INFO, args);
					}
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
