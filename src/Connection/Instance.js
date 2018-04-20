import { CLOSE, RESTART, CLONE } from './constants';
import getInfoVerbose from './getInfoVerbose';
import { killPid, removePidFile, getPids } from './PidHelpers';
import { logger } from 'pot-logger';
import {
	getSocketFiles,
	startClient,
	getSocketPath,
	removeDomainSocketFile,
} from './SocketsHelpers';
import { ensureWorkspace, getState } from './ConnectionUtils';
import { differenceWith } from 'lodash';
import isWin from '../utils/isWin';

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
		ensureWorkspace(options);
		const refs = await getAll();
		return refs.map((ref) => new Instance(ref, options));
	}

	static async getInstanceByKey(key, options) {
		ensureWorkspace(options);
		const refs = await getByKey(key);
		return refs.map((ref) => new Instance(ref, options));
	}

	static async getInstancesByName(name, options) {
		ensureWorkspace(options);
		const refs = await getByName(name);
		return refs.map((ref) => new Instance(ref, options));
	}

	constructor({ socket }, options = {}) {
		this._keepAlive = options.keepAlive;
		this._socket = socket;
	}

	async _response(res) {
		let response;
		if (res) response = await res;
		if (!this._keepAlive) this.disconnect();
		return response;
	}

	async _getState(...args) {
		const state = await getState(this._socket, ...args);
		return this._response(state);
	}

	async setState(state) {
		return this._getState(state);
	}

	async getState() {
		return this._getState();
	}

	async getInfo() {
		return this.getState();
	}

	async getInfoVerbose() {
		const state = await this.getState();
		return getInfoVerbose(state);
	}

	async restart() {
		return this._response(this._socket.request(RESTART));
	}

	async scale(number) {

		// TODO: should handle `down` case
		return this._response(this._socket.request(CLONE, number));
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
		const socket = this._socket;
		const state = await getState(socket);
		if (!state) return;
		const { key, ppid, socketPath, pidFile } = state;
		await Promise.all([
			new Promise((resolve) => {
				socket.once('close', resolve);
				socket.request(CLOSE).catch(logger.debug);
			}),
			killPid(key, ppid, options),
		]);
		await Promise.all([
			removeDomainSocketFile(socketPath),
			removePidFile(pidFile),
		]);
	}
}
