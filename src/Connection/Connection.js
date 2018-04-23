import { getPidFile, writePid, killPid, removePidFile } from './PidHelpers';
import { uniq } from 'lodash';
import {
	startServer,
	getSocketPath,
	removeDomainSocketFile,
} from './SocketsHelpers';
import { ensureWorkspace } from './ConnectionUtils';
import { logger } from 'pot-logger';
import getKey from './getKey';
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

	static async serve(masterMonitor, workerMonitor) {
		const { data: options, id } = workerMonitor;
		ensureWorkspace(options);

		const key = getKey(workerMonitor);
		const pidFile = await getPidFile(key);
		const socketPath = await getSocketPath(key);

		options.instanceId = id;
		options.key = key;
		options.pidFile = pidFile;
		options.socketPath = socketPath;
		options.displayName = options.name + (id ? ` #${id}` : '');

		await startServer(masterMonitor, workerMonitor);
		await writePid(options);
	}

	static async writePid(monitor) {
		await writePid(monitor.data);
	}

	static async shutDown(masterMonitor, workerMonitor, options) {
		await workerMonitor.stop();

		// TODO: remove `killPid`?
		const { key, ppid, socketPath, pidFile } = workerMonitor.toJSON();

		// console.log('key', key);
		// console.log('ppid', ppid);
		// console.log('socketPath', socketPath);
		// console.log('process.pid', process.pid);

		// await killPid(key, ppid, options);
		// console.log('killed', ppid);

		await Promise.all([
			removeDomainSocketFile(socketPath),
			removePidFile(pidFile),
		]);

		const { workerMonitors } = masterMonitor;
		const index = workerMonitors.indexOf(workerMonitor);
		workerMonitors.splice(index, 1);
		if (!workerMonitors.length) process.exit(0);
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

	async scale(number) {
		const res = await this.instances[0].scale(number);
		await this.disconnect();
		return res;
	}

	async disconnect() {
		return this._each('disconnect');
	}

	async requestStopServer(options = {}) {
		options.shouldLog && logger.info(`"${this._name}" stopped`);
		return this._each('requestStopServer');
	}
}
