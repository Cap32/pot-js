import getInfoVerbose from './getInfoVerbose';
import { REQUEST, PUBLISH } from '../utils/SocketEventTypes';
import { getPids } from '../utils/PidHelpers';
import {
	getSocketDiscripers,
	startClient,
	getSocketPath,
	removeDomainSocket,
} from '../utils/SocketsHelpers';
import { differenceWith } from 'lodash';
import isWin from '../utils/isWin';
import workspace from '../utils/workspace';

const request = async function request(socket, method, ...args) {
	const data = { method, args };
	socket.send(REQUEST, data);
	return new Promise((resolve) => {
		socket.dataOnce(method, resolve);
	});
};

const publish = function publish(socket, method, ...args) {
	const data = { method, args };
	socket.send(PUBLISH, data);
};

const getState = async function getState(socket, ...args) {
	try {
		return await request(socket, 'state', ...args);
	}
	catch (err) {
		socket.end();
		return null;
	}
};

const getAll = async function getAll() {
	const pidRefs = await getPids();
	const socketRefs = await getSocketDiscripers();
	const refsList = [];
	await Promise.all(
		pidRefs.map(async ({ pid, key, pidFile }) => {
			const socketPath = await getSocketPath(key);
			const socket = await startClient(socketPath);
			if (socket) {
				refsList.push({ key, socket, pid, pidFile, socketPath });
			}
			else {
				removeDomainSocket(socketPath);
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
					socket.end();
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
					socket.end();
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

	async request(method, ...args) {
		const response = await request(this._socket, method, ...args);
		if (!this._keepAlive) this.disconnect();
		return response;
	}

	async publish(method, ...args) {
		publish(this._socket, method, ...args);
	}

	async setState(newState) {
		return this.request('state', newState);
	}

	async getState() {
		return this.request('state');
	}

	async getInfo() {
		return this.getState();
	}

	async getInfoVerbose() {
		const state = await this.getState();
		return getInfoVerbose(state);
	}

	async restart() {
		return this.request('restart');
	}

	async scale(number) {
		return this.request('scale', number);
	}

	disconnect() {
		this._socket.end();
		// this._socket.destroy();
	}

	requestShutDown() {
		this.publish('requestShutDown');
		this.disconnect();
	}
}
