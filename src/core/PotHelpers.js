import { getPids } from '../utils/PidHelpers';
import {
	getSocketDiscripers,
	getSocketPath,
	startClient,
	removeDomainSocket,
} from '../utils/SocketsHelpers';
import { differenceWith } from 'lodash';
import isWin from '../utils/isWin';

export async function getStateList(socket, ...args) {
	try {
		const res = await new Promise((resolve) => {
			socket.send('state', args, resolve);
		});
		return res && res.stateList;
	}
	catch (err) {
		socket.close();
		return null;
	}
}

export async function getAll() {
	const pidRefs = await getPids();
	const refsList = [];

	if (isWin) {
		await Promise.all(
			pidRefs.map(async ({ name, pid }) => {
				const socketPath = await getSocketPath(name);
				const socket = await startClient(socketPath);
				if (socket) {
					refsList.push({ name, socket, socketPath });
				}
				else {
					// TODO: remove pid file
				}
			}),
		);
	}
	else {
		const socketRefs = await getSocketDiscripers();
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

		// remove dead socket files
		await Promise.all(
			differenceWith(
				socketRefs,
				pidRefs,
				(socketRef, pidRef) => socketRef.name === pidRef.name,
			)
				.filter((socketRef) => {
					return !refsList.find((ref) => ref.name === socketRef.name);
				})
				.map(async (socketRef) => {
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
				else socket.close();
			}
		}),
	);
	return matchedRef;
}
