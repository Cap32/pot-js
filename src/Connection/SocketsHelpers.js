import { remove } from 'fs-extra';
import { basename, join } from 'path';
import { createServer, createClient } from './ipc';
import { ensureLocalDomainPath } from 'create-local-domain-socket';
import { STATE, CLOSE } from './constants';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import globby from 'globby';
import { noop, isObject } from 'lodash';
import isWin from '../utils/isWin';

export async function getSocketFiles(cwd) {
	const socketFiles = await globby(['*'], {
		absolute: true,
		cwd,
	});
	return socketFiles.map((socketPath) => ({
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
	return remove(socketPath).catch(noop);
}

export function getSocketPath(socketPath, name) {
	return ensureLocalDomainPath(join(socketPath, name));
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
			await removeDomainSocketFile(socketFile);
		}
		else {
			logger.error('socket error', err);
		}
	}
}
