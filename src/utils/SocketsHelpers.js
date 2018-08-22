import { remove } from 'fs-extra';
import workspace from './workspace';
import { ensureLocalDomainPath } from 'create-local-domain-socket';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import globby from 'globby';
import { noop, isString, isObject, isFunction } from 'lodash';
import isWin from './isWin';
import { createServer, createClient } from './createSockets';
import * as deprecatedIpcAdapter from './deprecatedIpcAdapter';
import { basename, dirname, join } from 'path';
import deprecated from '../utils/deprecated';

export async function getSocketDiscripers() {
	const runDir = await workspace.getRunDir();

	// DEPRECATED: workspace.DEPRECATED_getSocketsDir()
	const deprecatedSocketsDir = await workspace.DEPRECATED_getSocketsDir();

	const patterns = [`${runDir}/**/*.sock`, `${deprecatedSocketsDir}/**/*`];

	const socketPaths = await globby(patterns, {
		absolute: true,
		expandDirectories: false,
		onlyFiles: false,
	});

	return socketPaths.map((socketPath) => ({
		socketPath,
		name: basename(socketPath, '.sock'),
	}));
}

export async function removeDomainSocket(socketPath) {
	if (isWin) {
		return;
	}
	if (isObject(socketPath)) {
		socketPath = socketPath.socketPath;
	}
	logger.trace('remove socket file', socketPath);
	return remove(socketPath).catch(noop);
}

export async function getSocketPath(nameOrMonitor) {
	const runDir = await workspace.getRunDir();
	const name = isString(nameOrMonitor) ?
		nameOrMonitor :
		nameOrMonitor.data.name;
	return ensureLocalDomainPath(join(runDir, name) + '.sock');
}

export async function startServer(masterMonitor, socketPath) {
	logger.trace('unix domain socket path', chalk.gray(socketPath));
	const socket = await createServer(socketPath);
	socket.on('message', async (method, args, reply) => {
		try {
			if (isFunction(masterMonitor[method])) {
				const resp = await masterMonitor[method](...args);
				reply(resp);
			}
			else {
				logger.warn(`Received API call "${method}", but it's not supported`);
			}
		}
		catch (err) {
			logger.error(`Failed to handle API call "${method}".`, err);
		}
	});
	return socket;
}

export async function startClient(socketPath, options = {}) {
	const { silence } = options;

	try {
		let clientSocket;
		const socketBase = basename(dirname(socketPath));
		if (socketBase === 'sockets') {
			deprecated('"$name" has been deprecated', basename(socketPath));
			clientSocket = await deprecatedIpcAdapter.createClient(socketPath);
		}
		else {
			clientSocket = await createClient(socketPath);
		}
		!silence && logger.trace('start client socket', socketPath);
		return clientSocket;
	}
	catch (err) {
		if (err && ~['ECONNRESET', 'ECONNREFUSED', 'ENOENT'].indexOf(err.code)) {
			await removeDomainSocket(socketPath);
		}
		else {
			!silence && logger.error('socket error', err);
		}
	}
}
