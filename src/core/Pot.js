import { isFunction } from 'lodash';
import { logger, flush } from 'pot-logger';
import delay from 'delay';
import flushOfflineDirs from '../utils/flushOfflineDirs';
import workspace from '../utils/workspace';
import { getByName, getAll } from './PotHelpers';
import getStateVerbose from './getStateVerbose';

export default class Pot {
	static async getNames(options) {
		workspace.set(options);
		const refs = await getAll();
		return refs.map((ref) => {
			ref.socket.close();
			return ref.name;
		});
	}

	static async getList(options) {
		workspace.set(options);
		const refs = await getAll();
		return Promise.all(refs.map(Pot.create));
	}

	static async getByName(name, options) {
		workspace.set(options);
		const ref = await getByName(name, options);
		return ref ? Pot.create(ref) : null;
	}

	static async getState(name, options = {}) {
		const pot = await Pot.getByName(name, options);
		if (!pot) return {};
		const state = await pot.getState(options.instanceIndex);
		pot.disconnect();
		return state;
	}

	static async getStateList(name, options) {
		const pot = await Pot.getByName(name, options);
		if (!pot) return {};
		const state = await pot.getStateList(options);
		pot.disconnect();
		return state;
	}

	static async flushOffline(onlinesNames) {
		if (!onlinesNames) onlinesNames = await Pot.getNames();
		return flushOfflineDirs(onlinesNames);
	}

	static create({ name, socket }) {
		return new Pot(name, socket);
	}

	constructor(name, socket) {
		this.name = name;
		this.socket = socket;
	}

	async request(method, ...args) {
		return new Promise((resolve) => {
			this.socket.send(method, args, resolve);
		});
	}

	async getStateList(options = {}) {
		const { verbose } = options;
		const { stateList } = await this.request('state');
		if (verbose) {
			const list = await Promise.all(stateList.map(getStateVerbose));
			return list.filter(Boolean);
		}
		return stateList;
	}

	async getState(index = 0) {
		const stateList = await this.getStateList();
		return stateList[index];
	}

	async restart(id) {
		return this.request('restart', id);
	}

	async reload(options = {}) {
		const stateList = await this.getStateList();
		const { length } = stateList;
		const { delay: timeout, onProgress } = options;
		const eachTimeout = length > 1 ? Math.max(100, timeout / length) : 0;
		for (const state of stateList) {
			if (!state) continue;
			const count = await this.restart(state.monitor.instanceId);
			const ok = count > 0;
			if (isFunction(onProgress)) onProgress(ok, state);
			await delay(eachTimeout);
		}
	}

	async scale(count) {
		return this.request('scale', count);
	}

	async flush() {
		const stateList = await this.getStateList();
		const logs = stateList
			.filter(({ logsDir }) => !!logsDir)
			.map(({ logsDir, monitor }) => ({
				logsDir,
				removeDir: monitor.status !== 'running',
			}));
		return Promise.all(logs.map(flush));
	}

	async size() {
		const stateList = await this.getStateList();
		return stateList.length;
	}

	async disconnect() {
		return this.socket.close();
	}

	async requestShutDown(options = {}) {
		options.shouldLog && logger.info(`"${this.name}" stopped`);
		this.request('requestShutDown');
		this.disconnect();
	}
}
