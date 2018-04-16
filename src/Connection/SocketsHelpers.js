import { remove } from 'fs-extra';
import { basename, join } from 'path';
import workspace from '../utils/workspace';
import { createServer, createClient } from './ipc';
import { ensureLocalDomainPath } from 'create-local-domain-socket';
import { STATE, CLOSE, RESTART } from './constants';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import globby from 'globby';
import { noop, isObject } from 'lodash';
import isWin from '../utils/isWin';

export async function getSocketFiles() {
	const runDir = await workspace.getRunDir();

	// DEPRECATED: workspace.DEPRECATED_getSocketsDir()
	const deprecatedSocketsDir = await workspace.DEPRECATED_getSocketsDir();

	const patterns = [`${runDir}/**/!(*.*)`, `${deprecatedSocketsDir}/**/!(*.*)`];
	const socketPaths = await globby(patterns, { absolute: true });
	return socketPaths.map((socketPath) => ({
		socketPath,
		name: basename(socketPath),
	}));
}

export async function removeDomainSocketFile(socketPath) {
	if (isWin) {
		return;
	}
	if (isObject(socketPath)) {
		socketPath = socketPath.socketPath;
	}
	logger.trace('remove socket file', socketPath);
	return remove(socketPath).catch(noop);
}

export async function getSocketPath(name) {
	const runDir = await workspace.getRunDir();
	return ensureLocalDomainPath(join(runDir, name));
}

export async function startServer(monitor) {
	const { data } = monitor;
	const { socketPath } = data;

	logger.trace('unix domain socket path', chalk.gray(socketPath));

	const socketServer = await createServer(socketPath);
	socketServer.reply(CLOSE, async () => {
		try {
			await socketServer.close();
			await removeDomainSocketFile(socketPath);
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

	socketServer.reply(RESTART, async () => {
		return monitor.restart();
	});

	return socketServer;
}

export async function startClient(socketPath, options = {}) {
	const { silence } = options;

	try {
		const clientSocket = await createClient(socketPath);
		silence || logger.trace('start client socket', socketPath);
		return clientSocket;
	}
	catch (err) {
		if (err && ~['ECONNRESET', 'ECONNREFUSED', 'ENOENT'].indexOf(err.code)) {
			await removeDomainSocketFile(socketPath);
		}
		else {
			silence || logger.error('socket error', err);
		}
	}
}
