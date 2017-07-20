
import workspace from '../utils//workspace';
import { startClient, disconnect } from '../utils/unixDomainSocket';
import globby from 'globby';
import { BRIDGE_EVENT_TYPE, DEPRECATED_BRIDGE_EVENT_TYPE } from '../constants';
import { logger } from '../utils/logger';

import getInfoVerbose from './getInfoVerbose';

const getNames = async () => {
	return globby(['*'], { cwd: await workspace.getSocketsDir() });
};

const getSocketByName = async (name) => {
	const names = await getNames();
	const socketDir = await workspace.getSocketsDir();
	for (const iteratorName of names) {
		if (iteratorName === name) {
			return startClient('monitor', name, socketDir);
		}
	}
};

const getSockets = async () => {
	const names = await getNames();
	const socketDir = await workspace.getSocketsDir();
	const sockets = await Promise.all(names.map(async (name) => {
		return startClient('monitor', name, socketDir);
	}));
	return sockets.filter(Boolean);
};

// const requestBySocket = (socket, arg) =>
// 	new Promise((resolve) => {
// 		const handler = (data) => {
// 			socket.off(BRIDGE_EVENT_TYPE, handler);
// 			resolve(data);
// 			disconnect(socket.id);
// 		};
// 		socket.on(BRIDGE_EVENT_TYPE, handler);
// 		socket.emit(BRIDGE_EVENT_TYPE, arg);
// 	})
// ;

// TODO: deprecated
const requestBySocket = (socket, arg) => {
	return Promise.race([
		new Promise((resolve) => {
			const handler = (data) => {
				socket.off(BRIDGE_EVENT_TYPE, handler);
				resolve(data);
				disconnect(socket.id);
			};
			socket.on(BRIDGE_EVENT_TYPE, handler);
			socket.emit(BRIDGE_EVENT_TYPE, arg);
		}),
		new Promise((resolve) => {
			const handler = (data) => {
				try {
					logger.warn(
						`The API of "pot-js" in "${data.data.name}" has DEPRECATED.`
					);
				}
				catch (err) {}
				socket.off(DEPRECATED_BRIDGE_EVENT_TYPE, handler);
				resolve(data);
				disconnect(socket.id);
			};
			socket.on(DEPRECATED_BRIDGE_EVENT_TYPE, handler);
			socket.emit(DEPRECATED_BRIDGE_EVENT_TYPE, arg);
		}),
	]);
};

export default class Bridge {
	static async getNames() {
		return getNames();
	}

	static async getByName(name) {
		const socket = await getSocketByName(name);
		return socket && new Bridge(socket);
	}

	static async getList() {
		const sockets = await getSockets();
		return sockets.map((socket) => new Bridge(socket));
	}

	constructor(socket) {
		this._socket = socket;
	}

	async getState() {
		return requestBySocket(this._socket);
	}

	async getInfo() {
		return this.getState();
	}

	async getInfoVerbose() {
		const monitor = await this.getState();
		return getInfoVerbose(monitor);
	}
}
