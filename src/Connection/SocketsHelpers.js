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
import getKey from './getKey';

export async function getSocketFiles() {
	const runDir = await workspace.getRunDir();

	// DEPRECATED: workspace.DEPRECATED_getSocketsDir()
	const deprecatedSocketsDir = await workspace.DEPRECATED_getSocketsDir();

	const patterns = [`${runDir}/**/!(*.*)`, `${deprecatedSocketsDir}/**/!(*.*)`];
	const socketPaths = await globby(patterns, { absolute: true });
	return socketPaths.map((socketPath) => ({
		socketPath,
		key: basename(socketPath, '.sock'),
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

export async function getSocketPath(keyOrMonitor) {
	const runDir = await workspace.getRunDir();
	const key = getKey(keyOrMonitor);
	return ensureLocalDomainPath(join(runDir, key));
}

export async function startServer(monitor) {
	const { socketPath } = monitor.data;

	logger.trace('unix domain socket path', chalk.gray(socketPath));
	const socketServer = await createServer(socketPath);

	socketServer.reply(CLOSE, async () => {
		try {
			await socketServer.close();
			await removeDomainSocketFile(monitor.data.socketPath);
		}
		catch (err) {
			logger.debug('Failed to close socket server', err);
		}
	});

	socketServer.reply(STATE, async (state) => {
		if (state) {
			Object.assign(monitor.data, state);
		}
		return monitor.toJSON();
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
