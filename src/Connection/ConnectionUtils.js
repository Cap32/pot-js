import workspace from '../utils/workspace';
import { STATE } from './constants';

export function ensureWorkspace(options = {}) {
	const space = options.workspace;
	if (space) workspace.set(space);
}

export async function getState(socket, ...args) {
	const state = await socket.request(STATE, ...args);

	// DEPRECATED: adapt to old version state
	if (state && state.data) {
		const { data } = state;
		delete state.data;
		state.monitor = state;
		Object.assign(state, data);
	}

	return state;
}
