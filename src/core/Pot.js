import { uniq, isFunction } from 'lodash';
import { logger, flush } from 'pot-logger';
import Instance from '../Instance';
import delay from 'delay';
import flushOfflineDirs from '../utils/flushOfflineDirs';

export default class Pot {
	static async getNames(options) {
		const instances = await Instance.getAllInstances(options);
		const names = await Promise.all(
			instances.map(async (instance) => {
				const state = await instance.getState();
				instance.disconnect();
				return state && state.name;
			}),
		);
		return uniq(names).filter(Boolean);
	}

	static async getByName(name, options) {
		const instances = await Instance.getInstancesByName(name, options);
		return instances.length ? new Pot(name, instances) : null;
	}

	static async getState(name, options = {}) {
		const pot = await Pot.getByName(name, options);
		if (!pot) return {};
		const state = await pot.getState(options.instanceIndex);
		pot.disconnect();
		return state;
	}

	static getAllInstances = Instance.getAllInstances;
	static getList = Pot.getAllInstances;

	static async flushOffline(onlinesNames) {
		if (!onlinesNames) onlinesNames = await Pot.getNames();
		return flushOfflineDirs(onlinesNames);
	}

	constructor(name, instances = []) {
		this.name = name;
		this.instances = instances;
	}

	async getState(instanceIndex = 0) {
		const instance = this.instances[instanceIndex];
		if (!instance) return {};
		return instance.getState();
	}

	async each(method, ...args) {
		return Promise.all(
			this.instances.map((instance) => instance[method](...args)),
		);
	}

	async restart() {
		return this.each('restart');
	}

	async reload(options = {}) {
		const { instances } = this;
		const { length } = instances;
		const { delay: timeout, onProgress } = options;
		const eachTimeout = length > 1 ? Math.max(100, timeout / length) : 0;
		for (const instance of instances) {
			const state = await instance.getState();
			if (!state) continue;
			const ok = await instance.restart();
			if (isFunction(onProgress)) onProgress(ok, state);
			await delay(eachTimeout);
		}
	}

	async scale(number) {
		const res = await this.instances[0].scale(number);
		return res;
	}

	async flush() {
		const stateList = await this.each('getState');
		const logs = stateList
			.filter(({ logsDir }) => !!logsDir)
			.map(({ logsDir, monitor }) => ({
				logsDir,
				removeDir: monitor.status !== 'running',
			}));
		return Promise.all(logs.map(flush));
	}

	size() {
		return this.instances.length;
	}

	async disconnect() {
		return this.each('disconnect');
	}

	async requestShutDown(options = {}) {
		options.shouldLog && logger.info(`"${this.name}" stopped`);
		return this.each('requestShutDown');
	}
}
