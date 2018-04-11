import { STATE, CLOSE } from './constants';
import getInfoVerbose from './getInfoVerbose';
import { getPidFile, killPid, writePid } from './PidHelpers';
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
		return list.map(async ({ name, socket }) => {
			await socket.close();
			return name;
		});
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

	constructor({ name, pid, pidFile, socketPath, socket }, options = {}) {
		this._keepAlive = options.keepAlive;
		this._name = name;
		this._pid = pid;
		this._pidFile = pidFile;
		this._socketPath = socketPath;
		this._socket = socket;
	}

	async _export(...args) {
		try {
			const state = await this._socket.request(STATE, ...args);

			// DEPRECATED: adapt to old version state
			if (state && state.data) {
				const { data } = state;
				delete state.data;
				state.monitor = state;
				Object.assign(state, data);
			}

			if (!this._keepAlive) {
				this.disconnect();
			}
			return state;
		}
		catch (err) {
			logger.debug(err);
			await this.disconnect();
		}
	}

	async setState(state) {
		return this._export(this._socket.request(STATE, state));
	}

	async getState() {
		return this._export(this._socket.request(STATE));
	}

	async getInfo() {
		return this.getState();
	}

	async getInfoVerbose() {
		const state = await this.getState();
		return getInfoVerbose(state);
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
		this._socket.request(CLOSE);
		this._socket.close();
		removeDomainSocketFile(this._socketPath);
		await killPid(this._name, this._pid, this._pidFile, options);
	}
}
