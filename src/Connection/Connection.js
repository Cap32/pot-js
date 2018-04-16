import { STATE, CLOSE, RESTART } from './constants';
import getInfoVerbose from './getInfoVerbose';
import { getPidFile, killPid, writePid, removePidFile } from './PidHelpers';
import { logger } from 'pot-logger';
import {
	startServer,
	getSocketPath,
	removeDomainSocketFile,
} from './SocketsHelpers';
import { getList, getByName, ensureWorkspace } from './ConnectionUtils';

export default class Connection {
	static async getNames(options) {
		ensureWorkspace(options);
		const list = await getList();
		return Promise.all(
			list.map(async ({ name, socket }) => {
				await socket.close();
				return name;
			}),
		);
	}

	static async getByName(name, options) {
		ensureWorkspace(options);
		const item = await getByName(name);
		return item && new Connection(item, options);
	}

	static async requestStopServer(name, options) {
		const connection = await Connection.getByName(name, options);
		if (connection) {
			return connection.requestStopServer(options);
		}
		else {
			return false;
		}
	}

	static async getState(name, options) {
		const connection = await Connection.getByName(name, options);
		if (connection) {
			return connection.getState();
		}
		else {
			return false;
		}
	}

	static async getList(options) {
		ensureWorkspace(options);
		const list = await getList();
		return list.map((item) => new Connection(item, options));
	}

	static async getPidFile(name, options) {
		ensureWorkspace(options);
		return getPidFile(name);
	}

	static async getSocketPath(name, options) {
		ensureWorkspace(options);
		return getSocketPath(name);
	}

	static async serve(monitor) {
		await startServer(monitor);
		await writePid(monitor.data);
	}

	constructor({ name, pid, pidFile, socket, socketPath }, options = {}) {
		this._keepAlive = options.keepAlive;
		this._name = name;
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
			const state = await this._socket.request(STATE, ...args);

			// DEPRECATED: adapt to old version state
			if (state && state.data) {
				const { data } = state;
				delete state.data;
				state.monitor = state;
				Object.assign(state, data);
			}

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
				this._socket.request(CLOSE);
			}),
			killPid(this._name, this._pid, options),
		]);

		await Promise.all([
			removeDomainSocketFile(this._socketPath),
			removePidFile(this._pidFile),
		]);
	}
}
