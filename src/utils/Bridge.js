
import { getSockets, getSocketByName, requestBySocket } from './socketsHelper';
import { API_GET_INFO } from '../constants';

class Bridge {
	constructor(socket) {
		this._socket = socket;
	}

	async getInfo(options) {
		return requestBySocket(this._socket, API_GET_INFO, options);
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
