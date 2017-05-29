
import workspace from './workspace';
import { startClient, disconnect } from '../utils/unixDomainSocket';
import globby from 'globby';

export const getNames = async () => {
	return globby(['*'], { cwd: await workspace.getSocketsDir() });
};

export const getSocketByName = async (name) => {
	const names = await getNames();
	for (const iteratorName of names) {
		if (iteratorName === name) {
			const socketDir = await workspace.getSocketsDir();
			return startClient('monitor', name, socketDir);
		}
	}
};

export const getSockets = async () => {
	const names = await getNames();
	const sockets = [];
	for (const name of names) {
		const socketDir = await workspace.getSocketsDir();
		sockets.push(await startClient('monitor', name, socketDir));
	}
	return sockets.filter(Boolean);
};

export const requestBySocket = (socket, command, arg) =>
	new Promise((resolve) => {
		const handler = (data) => {
			socket.off(command, handler);
			resolve(data);
			disconnect(socket.id);
		};
		socket.on(command, handler);
		socket.emit(command, arg);
	})
;
