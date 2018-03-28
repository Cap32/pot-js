import { remove, writeFile } from 'fs-extra';
import { createServer, createClient } from './ipc';
import { join } from 'path';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import workspace from './workspace';
import isWin from './isWin';
import { CONNECTION_CLOSE } from '../constants';

export async function startServer(id) {
	const socketsDir = await workspace.getSocketsDir();
	const path = join(socketsDir, id);

	logger.trace('unix domain socket path', chalk.gray(path));

	if (isWin) {
		await writeFile(path);
	}

	const server = await createServer(path);
	server.reply(CONNECTION_CLOSE, async () => {
		try {
			await server.close();
		}
		catch (err) {
			logger.debug('Failed to close server', err);
		}
	});
	return server;
}

export async function startClient(id) {
	const socketsDir = await workspace.getSocketsDir();
	const path = join(socketsDir, id);
	try {
		return await createClient(path);
	}
	catch (err) {
		if (err && ~['ECONNRESET', 'ECONNREFUSED', 'ENOENT'].indexOf(err.code)) {
			await remove(path);
		}
		else {
			logger.error('socket error', err);
		}
	}
}
