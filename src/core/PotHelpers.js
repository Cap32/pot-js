import { REQUEST, PUBLISH } from '../utils/SocketEventTypes';
import { getPids } from '../utils/PidHelpers';
import {
	getSocketDiscripers,
	startClient,
	getSocketPath,
	removeDomainSocket,
} from '../utils/SocketsHelpers';
import { differenceWith } from 'lodash';
import isWin from '../utils/isWin';

export async function request(socket, method, ...args) {
	const data = { method, args };
	socket.send(REQUEST, data);
	return new Promise((resolve) => {
		socket.dataOnce(method, resolve);
	});
}

export async function publish(socket, method, ...args) {
	const data = { method, args };
	socket.send(PUBLISH, data);
}

export async function getStateList(socket, ...args) {
	try {
		const res = await request(socket, 'state', ...args);
		return res && res.stateList;
	}
	catch (err) {
		socket.end();
		return null;
	}
}

export async function getAll() {
	const pidRefs = await getPids();
	const socketRefs = await getSocketDiscripers();
	const refsList = [];

	await Promise.all(
		socketRefs.map(async ({ socketPath, name }) => {
			const socket = await startClient(socketPath);
			if (socket) {
				refsList.push({ name, socket, socketPath });
			}
			else {
				removeDomainSocket(socketPath);
			}
		}),
	);
	// await Promise.all(
	// 	pidRefs.map(async ({ pid, name, pidFile }) => {
	// 		const socketPath = await getSocketPath(name);
	// 		const socket = await startClient(socketPath);
	// 		if (socket) {
	// 			refsList.push({ name, socket, pid, pidFile, socketPath });
	// 		}
	// 		else {
	// 			removeDomainSocket(socketPath);
	// 		}
	// 	}),
	// );

	// remove zombie socket files
	if (!isWin) {
		await Promise.all(
			differenceWith(
				socketRefs,
				pidRefs,
				(socketRef, pidRef) => socketRef.name === pidRef.name,
			).map(async (socketRef) => {
				const socket = await startClient(socketRef.socketPath);
				if (socket) {
					const stateList = await getStateList(socket);
					if (stateList.length) {
						const { pidFile, pid } = stateList[0];
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
}

export async function getByName(name) {
	const refsList = await getAll();
	let matchedRef;
	await Promise.all(
		refsList.map(async (ref) => {
			const { socket } = ref;
			const stateList = await getStateList(socket);
			if (stateList.length) {
				if (name === stateList[0].name) matchedRef = ref;
				else socket.end();
			}
		}),
	);
	return matchedRef;
}
