import { Server, Client } from 'promise-ws';
import createLocalDomainSocket from 'create-local-domain-socket';
import http from 'http';
import * as deprecatedIpcAdapter from './deprecatedIpcAdapter';
import delay from 'delay';

export async function createServer(socketPath) {
	const server = http.createServer((req, res) => {
		const body = http.STATUS_CODES[426];
		res.writeHead(426, {
			'Content-Length': body.length,
			'Content-Type': 'text/plain',
		});
		res.end(body);
	});

	await createLocalDomainSocket(server, socketPath);
	const wsServer = await Server.create({ server });

	wsServer.reply('close', wsServer.close.bind(wsServer));
	return wsServer;
}

export async function createClient(socketPath) {
	const timeoutPromise = delay(20000);
	const timeout = async () => {
		await timeoutPromise;
		throw new Error('TIMEOUT');
	};

	const res = await Promise.race([

		// deprecatedIpcAdapter.createClient(socketPath),

		Client.create(`ws+unix://${socketPath}`),
		timeout(),
	]);
	timeoutPromise.cancel();
	return res;
}
