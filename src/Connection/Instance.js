import { CLOSE, RESTART } from './constants';
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
					const { pidFile, parentPid: pid } = state;
					refsList.push({
						pidFile,
						pid,
						...socketRef,
						socket,
					});
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
			if (name === state.name) {
				res.push(ref);
			}
			else {
				await socket.close();
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
			if (key === state.key) {
				res = ref;
			}
			else {
				await socket.close();
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

	constructor({ key, pid, pidFile, socket, socketPath }, options = {}) {
		this._keepAlive = options.keepAlive;
		this._key = key;
		this._pid = pid;
		this._pidFile = pidFile;
		this._socketPath = socketPath;
		this._socket = socket;
	}

	async _response(res) {
		let response;
		if (res) response = await res;
		if (!this._keepAlive) this.disconnect();
		return response;
	}

	async _getState(...args) {
		try {
			const state = await getState(this._socket, ...args);
			return this._response(state);
		}
		catch (err) {
			logger.debug(err);
			await this.disconnect();
		}
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

	async disconnect() {
		try {
			await this._socket.close();
		}
		catch (err) {
			logger.debug(err);
		}
	}

	async requestStopServer(options) {
		await Promise.all([
			new Promise((resolve) => {
				this._socket.once('close', resolve);
				this._socket.request(CLOSE).catch(logger.debug);
			}),
			killPid(this._key, this._pid, options),
		]);
		await Promise.all([
			removeDomainSocketFile(this._socketPath),
			removePidFile(this._pidFile),
		]);
	}
}
