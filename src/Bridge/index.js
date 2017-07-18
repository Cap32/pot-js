
import {
	getSockets, getSocketByName, requestBySocket,
} from '../utils/socketsHelper';
import getInfoVerbose from './getInfoVerbose';

class Bridge {
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

export async function getBridgeByName(name) {
	const socket = await getSocketByName(name);
	return new Bridge(socket);
}

export async function getBridges() {
	const sockets = await getSockets();
	return sockets.map((socket) => new Bridge(socket));
}
