import { getPidFile, writePid } from './PidHelpers';
import { uniq } from 'lodash';
import { startServer, getSocketPath } from './SocketsHelpers';
import { ensureWorkspace } from './ConnectionUtils';
import { logger } from 'pot-logger';
import getKey from './getKey';
import Instance from './Instance';

export default class Connection {
	static async getNames(options) {
		const instances = await Instance.getAllInstances(options);
		const names = await Promise.all(
			instances.map(async (instance) => {
				const { name } = await instance.getState();
				return name;
			}),
		);
		return uniq(names);
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

	static async serve(monitor) {
		const { data: options, id } = monitor;
		ensureWorkspace(options);

		const key = getKey(monitor);
		const pidFile = await getPidFile(key);
		const socketPath = await getSocketPath(key);

		options.instanceId = id;
		options.key = key;
		options.pidFile = pidFile;
		options.socketPath = socketPath;
		options.displayName = options.name + (id ? ` #${id}` : '');

		await startServer(monitor);
		await writePid(options);
	}

	static async writePid(monitor) {
		await writePid(monitor.data);
	}

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

	async _each(method, ...args) {
		return Promise.all(
			this.instances.map((instance) => instance[method](...args)),
		);
	}

	async restart() {
		return this._each('restart');
	}

	async disconnect() {
		return this._each('disconnect');
	}

	async requestStopServer(options = {}) {
		options.shouldLog && logger.info(`"${this._name}" stopped`);
		return this._each('requestStopServer');
	}
}
