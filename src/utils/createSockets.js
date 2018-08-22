import axon from 'pm2-axon';
import { ensureLocalDomainPath } from 'create-local-domain-socket';
import delay from 'delay';

const once = (target, resolves, rejects) => {
	const finalResolve = () => {
		bind('removeListener');
		resolves.resolve(target);
	};
	const finalReject = (err) => {
		bind('removeListener');
		rejects.reject(err);
	};
	const bind = (method) => {
		resolves.events.forEach((event) => {
			target[method](event, finalResolve);
		});
		rejects.events.forEach((event) => {
			target[method](event, finalReject);
		});
	};
	bind('on');
};

export async function createServer(socketPath) {
	const server = axon.socket('rep');
	return new Promise((resolve, reject) => {
		once(server, { events: ['bind'], resolve }, { events: ['error'], reject });
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
			once(
				client,
				{ events: ['connect'], resolve },
				{ events: ['error', 'ignored error', 'socket error'], reject },
			);
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
