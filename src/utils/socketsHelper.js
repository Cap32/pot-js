
import { join } from 'path';
import workspace from './workspace';
import { startClient, disconnect } from '../utils/unixDomainSocket';
import globby from 'globby';

const getSocketPath = async (name) =>
	join(await workspace.getSocketsDir(), name)
;

export const getNames = async () => {
	return await globby(['*'], { cwd: await workspace.getSocketsDir() });
};

export const findSocketByName = async (name) => {
	const names = await getNames();
	for (const iteratorName of names) {
		if (iteratorName === name) {
			const socketPath = await getSocketPath(name);
			return await startClient('monitor', name, socketPath);
		}
	}
};

export const getSockets = async () => {
	const names = await getNames();
	const sockets = [];
	for (const name of names) {
		const socketPath = await getSocketPath(name);
		sockets.push(await startClient('monitor', name, socketPath));
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

export const requestByName = async (name, command, arg) => {
	const socket = await findSocketByName(name);
	if (!socket) { return; }
	return await requestBySocket(socket, command, arg);
};

export const request = requestByName;

export const requestAll = async (command, arg) => {
	const sockets = await getSockets();
	const runners = sockets.map((socket) =>
		requestBySocket(socket, command, arg)
	);
	return Promise.all(runners);
};
