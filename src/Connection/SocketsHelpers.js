import { remove } from 'fs-extra';
import { join } from 'path';
import { createServer, createClient } from './ipc';
import { STATE, CLOSE } from './constants';
import { logger } from 'pot-logger';
import chalk from 'chalk';

export async function removeDomainSocketFile(file) {
	return remove(file);
}

export function getSocketPath(socketPath, name) {
	return join(socketPath, name);
}

export async function startServer(monitor) {
	const { data } = monitor;
	const path = data.socketPath;

	logger.trace('unix domain socket path', chalk.gray(path));

	const socketServer = await createServer(path);
	socketServer.reply(CLOSE, async () => {
		try {
			await socketServer.close();
		}
		catch (err) {
			logger.debug('Failed to close socketServer', err);
		}
	});

	socketServer.reply(STATE, async (state) => {
		if (state) {
			Object.assign(data, state);
		}
		const monitorState = monitor.toJSON();
		return monitorState;
	});

	return socketServer;
}

export async function startClient(socketFile) {
	try {
		return await createClient(socketFile);
	}
	catch (err) {
		if (err && ~['ECONNRESET', 'ECONNREFUSED', 'ENOENT'].indexOf(err.code)) {
			await remove(socketFile);
		}
		else {
			logger.error('socket error', err);
		}
	}
}
