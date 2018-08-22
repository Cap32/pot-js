import axon from 'pm2-axon';
import { ensureLocalDomainPath } from 'create-local-domain-socket';
import delay from 'delay';

export async function createServer(socketPath) {
	const server = axon.socket('rep');
	return new Promise((resolve, reject) => {
		server.once('bind', () => resolve(server));
		server.once('error', reject);
		server.bind(ensureLocalDomainPath(socketPath));
	});
}

export async function createClient(socketPath, timeout = 30000) {
	const timeoutPromise = delay(timeout);
	const createTimeout = async () => {
		await timeoutPromise;
		throw new Error('TIMEOUT');
	};

	const createClientPromise = (function () {
		const client = axon.socket('req');
		return new Promise((resolve, reject) => {
			client.once('connect', () => resolve(client));
			client.once('error', reject);
			client.connect(ensureLocalDomainPath(socketPath));
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
