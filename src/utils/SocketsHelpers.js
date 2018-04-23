import { remove } from 'fs-extra';
import { basename, join } from 'path';
import workspace from './workspace';
import { createServer, createClient } from './ipc';
import { ensureLocalDomainPath } from 'create-local-domain-socket';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import globby from 'globby';
import { noop, isObject } from 'lodash';
import isWin from './isWin';
import getKey from './getKey';
import { STATE, RESTART, SCALE } from './SocketEventTypes';

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

export async function startServer(masterMonitor, workerMonitor) {
	const { socketPath } = workerMonitor.data;

	logger.trace('unix domain socket path', chalk.gray(socketPath));
	const socketServer = await createServer(socketPath);

	socketServer.onReplyClose(async () => {
		process.nextTick(async () => {
			await masterMonitor.requestShutDown(workerMonitor);
		});
		return true;
	});

	socketServer.reply(STATE, async (newState) => {
		return masterMonitor.state(workerMonitor, newState);
	});

	socketServer.reply(RESTART, async () => {
		return masterMonitor.restart(workerMonitor);
	});

	socketServer.reply(SCALE, async (number) => {
		return masterMonitor.scale(number);
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
