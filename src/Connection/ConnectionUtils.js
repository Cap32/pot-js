import workspace from '../utils/workspace';
import { STATE } from './constants';
import { noop } from 'lodash';

export function ensureWorkspace(options = {}) {
	const space = options.workspace;
	if (space) workspace.set(space);
}

export async function getState(socket, ...args) {
	try {
		const state = await socket.request(STATE, ...args);

		// DEPRECATED: adapt to old version state
		if (state && state.data) {
			const { data } = state;
			delete state.data;
			state.monitor = state;
			Object.assign(state, data);
			if (state.parentPid && !state.ppid) state.ppid = state.parentPid;
		}

		return state;
	}
	catch (err) {
		socket.close().catch(noop);
		return null;
	}
}
