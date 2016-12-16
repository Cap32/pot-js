
import { writeFile, readFile, open, unlink } from 'fs-promise';
import processExists from 'process-exists';
import { join } from 'path';
import { trim } from 'lodash';
import workspace from './workspace';
import { startClient, disconnect } from '../utils/unixDomainSocket';
import globby from 'globby';

export const getPidFile = async (name) =>
	join(await workspace.getPidsDir(), `${name}.pid`)
;

const getSocketPath = async (name) =>
	join(await workspace.getSocketsDir(), name)
;

export const writePidFile = writeFile;

const checkIsPidFileExists = async (pidFile) => {
	try { return !!await open(pidFile, 'r'); }
	catch (err) { return false; }
};

export const getPid = async (pidFile) => {
	const isFileExists = await checkIsPidFileExists(pidFile);
	if (isFileExists) {
		const pid = +trim(await readFile(pidFile, 'utf-8'));
		const isProcessExists = await processExists(pid);
		if (!isProcessExists) { await unlink(pidFile); }
		return isProcessExists && pid;
	}
	return false;
};

const getNames = async () => {
	return await globby(['*'], { cwd: await workspace.getSocketsDir() });
};

const findSocketByName = async (name) => {
	const names = await getNames();
	for (const iteratorName of names) {
		if (iteratorName === name) {
			const socketPath = await getSocketPath(name);
			return await startClient('monitor', name, socketPath);
		}
	}
};

const getSockets = async () => {
	const names = await getNames();
	const sockets = [];
	for (const name of names) {
		const socketPath = await getSocketPath(name);
		sockets.push(await startClient('monitor', name, socketPath));
	}
	return sockets.filter(Boolean);
};

const execCommand = (socket, command, arg) => new Promise((resolve) => {
	const handler = (data) => {
		socket.off(command, handler);
		resolve(data);
		disconnect(socket.id);
	};
	socket.on(command, handler);
	socket.emit(command, arg);
});

export const execByName = async (name, command, arg) => {
	const socket = await findSocketByName(name);
	if (!socket) { return; }
	return await execCommand(socket, command, arg);
};

export const execAll = async (command, arg) => {
	const sockets = await getSockets();
	const runners = sockets.map((socket) =>
		execCommand(socket, command, arg)
	);
	return Promise.all(runners);
};
