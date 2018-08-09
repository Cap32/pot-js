import nssocket from 'nssocket';
import delay from 'delay';
import createLocalDomainSocket from 'create-local-domain-socket';
import { REQUEST, PUBLISH } from './SocketEventTypes';
import { logger } from 'pot-logger';
import EventEmitter from 'events';

export async function createServer(portOrPath, connect) {
	const server = nssocket.createServer((socket) => {
		const reqRepBus = new EventEmitter();
		const pubSubBus = new EventEmitter();

		socket.data(REQUEST, (data) => {
			if (data && data.event) {
				reqRepBus.emit(data.event, ...data.args);
			}
		});

		socket.data(PUBLISH, (data) => {
			if (data && data.event) {
				pubSubBus.emit(data.event, ...data.args);
			}
		});

		socket.rep = async function rep(event, handler) {
			reqRepBus.on(event, async (...args) => {
				try {
					const res = await handler(...args);
					socket.send(event, res);
				}
				catch (err) {
					logger.error(`Failed to reply "${event}"`);
					socket.emit('error', err);
				}
			});
		};

		socket.sub = async function sub(event, handler) {
			pubSubBus.on(event, async (...args) => {
				try {
					await handler(...args);
				}
				catch (err) {
					logger.error(`Failed to subscribe "${event}"`);
					socket.emit('error', err);
				}
			});
		};

		connect(socket);
	});
	if (/^\d/.test(portOrPath)) {
		return new Promise((resolve, reject) => {
			server.once('error', reject);
			server.listen(portOrPath, () => resolve(server));
		});
	}
	else {
		await createLocalDomainSocket(server, portOrPath);
		return server;
	}
}

export async function createClient(portOrPath, timeout = 30000) {
	const timeoutPromise = delay(timeout);
	const createTimeout = async () => {
		await timeoutPromise;
		throw new Error('TIMEOUT');
	};

	const createClientPromise = (function () {
		const client = new nssocket.NsSocket();

		client.req = (event, ...args) => {
			const data = { event, args };
			client.send(REQUEST, data);
			return new Promise((resolve) => {
				client.dataOnce(event, resolve);
			});
		};

		client.pub = (event, ...args) => {
			const data = { event, args };
			client.send(PUBLISH, data);
		};

		return new Promise((resolve, reject) => {
			client.on('start', () => resolve(client));
			client.on('error', reject);
			client.connect(portOrPath);
		});
	})();

	try {
		const res = await Promise.race([createClientPromise, createTimeout()]);
		timeoutPromise.cancel();
		return res;
	}
	catch (err) {
		timeoutPromise.cancel();
		throw err;
	}
}
