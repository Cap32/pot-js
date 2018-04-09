import workspace from '../utils/workspace';
import { STATE, CLOSE } from './constants';
import getInfoVerbose from './getInfoVerbose';
import { getPidFile, killPid, writePid } from './PidHelpers';
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
		return item && new Connection(item);
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
		return list.map((item) => new Connection(item));
	}

	static async getPidFile(name, options) {
		ensureWorkspace(options);
		const pidsDir = await workspace.getPidsDir();
		return getPidFile(pidsDir, name);
	}

	static async getSocketPath(name, options) {
		ensureWorkspace(options);
		const socketsDir = await workspace.getSocketsDir();
		return getSocketPath(socketsDir, name);
	}

	static async serve(monitor) {
		await startServer(monitor);
		await writePid(monitor.data);
	}

	constructor({ name, pid, pidFile, socketPath, socket }) {
		this._name = name;
		this._pid = pid;
		this._pidFile = pidFile;
		this._socketPath = socketPath;
		this._socket = socket;
	}

	async setState(state) {
		const res = await this._socket.request(STATE, state);
		await this.disconnect();
		return res;
	}

	async getState() {
		const res = await this._socket.request(STATE);
		await this.disconnect();
		return res;
	}

	async getInfo() {
		return this.getState();
	}

	async getInfoVerbose() {
		const state = await this.getState();
		return getInfoVerbose(state);
	}

	async disconnect() {
		return this._socket.close();
	}

	async requestStopServer(options) {
		this._socket.request(CLOSE);
		this._socket.close();
		removeDomainSocketFile(this._socketPath);
		await killPid(this._name, this._pid, this._pidFile, options);
	}
}
