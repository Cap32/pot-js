import { uniq } from 'lodash';
import { logger } from 'pot-logger';
import Instance from './Instance';

export default class Connection {
	static async getNames(options) {
		const instances = await Instance.getAllInstances(options);
		const names = await Promise.all(
			instances.map(async (instance) => {
				const state = await instance.getState();
				return state && state.name;
			}),
		);
		return uniq(names).filter(Boolean);
	}

	static async getByName(name, options) {
		const instances = await Instance.getInstancesByName(name, options);
		return instances.length ? new Connection(name, instances) : null;
	}

	static async getState(name, options = {}) {
		const connection = await Connection.getByName(name, options);
		if (!connection) return {};
		return connection.getState(options.instanceIndex);
	}

	static getAllInstances = Instance.getAllInstances;

	static getList = Connection.getAllInstances;

	constructor(name, instances = []) {
		this._name = name;
		this.instances = instances;
	}

	async getState(instanceIndex = 0) {
		const instance = this.instances[instanceIndex];
		if (!instance) return {};
		const state = await instance.getState();
		await this.disconnect();
		return state;
	}

	async each(method, ...args) {
		return Promise.all(
			this.instances.map((instance) => instance[method](...args)),
		);
	}

	async restart() {
		return this.each('restart');
	}

	async scale(number) {
		const res = await this.instances[0].scale(number);
		await this.disconnect();
		return res;
	}

	async disconnect() {
		return this.each('disconnect');
	}

	async requestStopServer(options = {}) {
		options.shouldLog && logger.info(`"${this._name}" stopped`);
		return this.each('requestStopServer');
	}
}
