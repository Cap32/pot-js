import getInfoVerbose from './getInfoVerbose';
import { CALL } from '../utils/SocketEventTypes';
import { getPids } from '../utils/PidHelpers';
import { logger } from 'pot-logger';
import {
	getSocketFiles,
	startClient,
	getSocketPath,
	removeDomainSocketFile,
} from '../utils/SocketsHelpers';
import { differenceWith, noop } from 'lodash';
import isWin from '../utils/isWin';
import workspace from '../utils/workspace';

const call = async function call(socket, method, ...args) {
	const data = { method, args };
	return socket.request(CALL, data);
};

const getState = async function getState(socket, ...args) {
	try {
		return await call(socket, 'state', ...args);
	}
	catch (err) {
		socket.close().catch(noop);
		return null;
	}
};

const getAll = async function getAll() {
	const pidRefs = await getPids();
	const socketRefs = await getSocketFiles();

	const refsList = [];
	await Promise.all(
		pidRefs.map(async ({ pid, key, pidFile }) => {
			const socketPath = await getSocketPath(key);
			const socket = await startClient(socketPath);
			if (socket) {
				refsList.push({ key, socket, pid, pidFile, socketPath });
			}
			else {
				removeDomainSocketFile(socketPath);
			}
		}),
	);

	// remove zombie socket files
	if (!isWin) {
		await Promise.all(
			differenceWith(
				socketRefs,
				pidRefs,
				(socketRef, pidRef) => socketRef.key === pidRef.key,
			).map(async (socketRef) => {
				const socket = await startClient(socketRef.socketPath);
				if (socket) {
					const state = await getState(socket);
					if (state) {
						const { pidFile, pid } = state;
						refsList.push({
							pidFile,
							pid,
							...socketRef,
							socket,
						});
					}
				}
			}),
		);
	}
	return refsList;
};

const getByName = async function getByName(name) {
	const refsList = await getAll();
	const res = [];
	await Promise.all(
		refsList.map(async (ref) => {
			const { socket } = ref;
			const state = await getState(socket);
			if (state) {
				if (name === state.name) {
					res.push(ref);
				}
				else {
					await socket.close();
				}
			}
		}),
	);
	return res;
};

const getByKey = async function getByKey(key) {
	const refsList = await getAll();
	let res;
	await Promise.all(
		refsList.map(async (ref) => {
			const { socket } = ref;
			const state = await getState(socket);
			if (state) {
				if (key === state.key) {
					res = ref;
				}
				else {
					await socket.close();
				}
			}
		}),
	);
	return res;
};

export default class Instance {
	static async getAllInstances(options) {
		workspace.set(options);
		const refs = await getAll();
		return refs.map((ref) => new Instance(ref, options));
	}

	static async getInstanceByKey(key, options) {
		workspace.set(options);
		const refs = await getByKey(key);
		return refs.map((ref) => new Instance(ref, options));
	}

	static async getInstancesByName(name, options) {
		workspace.set(options);
		const refs = await getByName(name);
		return refs.map((ref) => new Instance(ref, options));
	}

	constructor({ socket }, options = {}) {
		this._keepAlive = options.keepAlive;
		this._socket = socket;
	}

	async call(method, ...args) {
		const response = await call(this._socket, method, ...args);
		if (!this._keepAlive) await this.disconnect();
		return response;
	}

	async setState(newState) {
		return this.call('state', newState);
	}

	async getState() {
		return this.call('state');
	}

	async getInfo() {
		return this.getState();
	}

	async getInfoVerbose() {
		const state = await this.getState();
		return getInfoVerbose(state);
	}

	async restart() {
		return this.call('restart');
	}

	async scale(number) {
		return this.call('scale', number);
	}

	async disconnect() {
		try {
			await this._socket.close();
		}
		catch (err) {
			logger.debug(err);
		}
	}

	async requestStopServer(options) {
		await this._socket.requestClose(options);
		await this.disconnect();
	}
}
