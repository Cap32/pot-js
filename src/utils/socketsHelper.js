
import workspace from './workspace';
import { startClient, disconnect } from '../utils/unixDomainSocket';
import globby from 'globby';
import { BRIDGE_EVENT_TYPE } from '../constants';

export const getNames = async () => {
	return globby(['*'], { cwd: await workspace.getSocketsDir() });
};

export const getSocketByName = async (name) => {
	const names = await getNames();
	const socketDir = await workspace.getSocketsDir();
	for (const iteratorName of names) {
		if (iteratorName === name) {
			return startClient('monitor', name, socketDir);
		}
	}
};

export const getSockets = async () => {
	const names = await getNames();
	const socketDir = await workspace.getSocketsDir();
	const sockets = await Promise.all(names.map(async (name) => {
		return startClient('monitor', name, socketDir);
	}));
	return sockets.filter(Boolean);
};

export const requestBySocket = (socket, arg) =>
	new Promise((resolve) => {
		const handler = (data) => {
			socket.off(BRIDGE_EVENT_TYPE, handler);
			resolve(data);
			disconnect(socket.id);
		};
		socket.on(BRIDGE_EVENT_TYPE, handler);
		socket.emit(BRIDGE_EVENT_TYPE, arg);
	})
;
