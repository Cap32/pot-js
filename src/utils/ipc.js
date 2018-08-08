import nssocket from 'nssocket';
import createLocalDomainSocket from 'create-local-domain-socket';
import * as deprecatedIpcAdapter from './deprecatedIpcAdapter';
import delay from 'delay';
import { basename, dirname } from 'path';
import deprecated from '../utils/deprecated';

export async function createServer(socketPath, connect) {
	const server = nssocket.createServer((socket) => {
		connect(socket);
	});
	await createLocalDomainSocket(server, socketPath);
	return server;
	// TODO:
	// wsServer.reply('close', wsServer.close.bind(wsServer));
}

export async function createClient(socketPath) {
	const timeoutPromise = delay(40000);
	const timeout = async () => {
		await timeoutPromise;
		throw new Error('TIMEOUT');
	};

	const socketBase = basename(dirname(socketPath));
	const createClientPromise = (function () {
		if (socketBase === 'sockets') {
			deprecated('"$name" has been deprecated', basename(socketPath));
			return deprecatedIpcAdapter.createClient(socketPath);
		}
		const client = new nssocket.NsSocket();
		return new Promise((resolve, reject) => {
			client.on('start', () => resolve(client));
			client.on('error', reject);
			client.connect(socketPath);
		});
	})();

	try {
		const res = await Promise.race([createClientPromise, timeout()]);
		timeoutPromise.cancel();
		return res;
	}
	catch (err) {
		timeoutPromise.cancel();
		throw err;
	}
}
