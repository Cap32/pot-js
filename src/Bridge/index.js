import workspace from '../utils/workspace';
import { startClient } from '../utils/unixDomainSocket';
import globby from 'globby';
import { BRIDGE_STATE } from '../constants';
import getInfoVerbose from './getInfoVerbose';

// import { logger } from 'pot-logger';

const getNames = async () => {
	return globby(['*'], { cwd: await workspace.getSocketsDir() });
};

const getSocketByName = async (name) => {
	const names = await getNames();
	const socketDir = await workspace.getSocketsDir();
	for (const iteratorName of names) {
		if (iteratorName === name) {
			return startClient(name, socketDir);
		}
	}
};

const getSockets = async () => {
	const names = await getNames();
	const socketDir = await workspace.getSocketsDir();
	const sockets = await Promise.all(
		names.map(async (name) => {
			return startClient(name, socketDir);
		}),
	);
	return sockets.filter(Boolean);
};

export default class Bridge {
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
		const socket = await getSocketByName(name);
		return socket && new Bridge(socket);
	}

	static async getList(space) {
		if (space) {
			workspace.set(space);
		}
		const sockets = await getSockets();
		return sockets.map((socket) => new Bridge(socket));
	}

	constructor(socket) {
		this._socket = socket;
	}

	async setState(state) {
		const res = await this._socket.request(BRIDGE_STATE, state);
		await this.disconnect();
		return res;
	}

	async getState() {
		const res = await this._socket.request(BRIDGE_STATE);
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
}
