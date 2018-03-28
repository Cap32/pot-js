import workspace from '../utils/workspace';
import { startClient } from '../utils/unixDomainSocket';
import { join } from 'path';
import { CONNECTION_STATE, CONNECTION_CLOSE } from '../constants';
import getInfoVerbose from './getInfoVerbose';
import { getPids, getPidFile, killPid, writePid } from './PidHelpers';
import { removeDomainSocketFile } from './SocketsHelpers';

const getList = async function getList() {
	const pidsDir = await workspace.getPidsDir();
	const socketsDir = await workspace.getSocketsDir();
	const pids = await getPids(pidsDir);

	const list = [];
	await Promise.all(
		pids.map(async ({ pid, name, pidFile }) => {
			const socketFile = join(socketsDir, name);
			if (!pid) {
				await removeDomainSocketFile(socketFile);
				return;
			}
			const socket = await startClient(name);
			if (socket) {
				list.push({ name, socket, pid, pidFile });
			}
			else {
				await removeDomainSocketFile(socketFile);
			}
		}),
	);
	return list;
};

const getByName = async function getByName(name) {
	const list = await getList();
	let res;
	await Promise.all(
		list.map(async (item) => {
			if (name === item.name) {
				res = item;
			}
			else {
				await item.socket.close();
			}
		}),
	);
	return res;
};

const getNames = async function getNames() {
	const list = await getList();
	return list.map(({ name }) => name);
};

export default class Connection {
	static async getNames(space) {
		if (space) {
			workspace.set(space);
		}
		return getNames();
	}

	static async getByName(name, space) {
		if (space) {
			workspace.set(space);
		}
		const item = await getByName(name);
		return item && new Connection(item);
	}

	static async getList(space) {
		if (space) {
			workspace.set(space);
		}
		const list = await getList();
		return list.map((item) => new Connection(item));
	}

	static async writePid(pidFile, pid) {
		await writePid(pidFile, pid);
	}

	static async getPidFile(name, space) {
		if (space) {
			workspace.set(space);
		}
		const pidsDir = await workspace.getPidsDir();
		return getPidFile(pidsDir, name);
	}

	constructor({ name, pid, pidFile, socket }) {
		this._name = name;
		this._pid = pid;
		this._pidFile = pidFile;
		this._socket = socket;
	}

	async setState(state) {
		const res = await this._socket.request(CONNECTION_STATE, state);
		await this.disconnect();
		return res;
	}

	async getState() {
		const res = await this._socket.request(CONNECTION_STATE);
		await this.disconnect();
		return res;
	}

	async getInfo() {
		return this.getState();
	}

	async getInfoVerbose() {
		const monitor = await this.getState();
		return getInfoVerbose(monitor);
	}

	async disconnect() {
		return this._socket.close();
	}

	async kill(options) {
		this._socket.request(CONNECTION_CLOSE);
		this._socket.close();
		await killPid(this._name, this._pid, this._pidFile, options);
	}
}
