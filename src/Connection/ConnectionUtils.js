import workspace from '../utils/workspace';
import { differenceWith } from 'lodash';
import isWin from '../utils/isWin';
import { getPids } from './PidHelpers';
import {
	getSocketFiles,
	startClient,
	getSocketPath,
	removeDomainSocketFile,
} from './SocketsHelpers';

export function ensureWorkspace(options = {}) {
	const { space } = options;
	if (space) {
		workspace.set(space);
	}
}

export async function getList() {
	const pidsDir = await workspace.getPidsDir();
	const socketsDir = await workspace.getSocketsDir();
	const pids = await getPids(pidsDir);
	const sockets = await getSocketFiles(socketsDir);

	const list = [];
	await Promise.all(
		pids.map(async ({ pid, name, pidFile }) => {
			const socketPath = getSocketPath(socketsDir, name);
			const socket = await startClient(socketPath);
			if (socket) {
				list.push({ name, socket, pid, pidFile, socketPath });
			}
			else {
				removeDomainSocketFile(socketPath);
			}
		}),
	);

	// remove zombie socket files
	if (!isWin) {
		differenceWith(
			sockets,
			pids,
			(socket, pid) => socket.name === pid.name,
		).forEach(removeDomainSocketFile);
	}
	return list;
}

export async function getByName(name) {
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
}
