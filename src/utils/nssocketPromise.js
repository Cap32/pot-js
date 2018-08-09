import nssocket from 'nssocket';
import delay from 'delay';
import createLocalDomainSocket from 'create-local-domain-socket';

export async function createServer(portOrPath, connect) {
	const server = nssocket.createServer((socket) => {
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
