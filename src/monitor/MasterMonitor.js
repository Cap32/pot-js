import { EventEmitter } from 'events';
import { ensureLogger, logger, setLoggers } from 'pot-logger';
import chalk from 'chalk';
import delay from 'delay';
import Connection from '../Connection';
import WorkerMonitor from './WorkerMonitor';
import workspace from '../utils/workspace';
import watch from '../utils/watch';
import onSignalExit from '../utils/onSignalExit';
import createScriptRunner from '../utils/createScriptRunner';
import { ENV_VAR_KEY } from '../utils/EnvVar';
import getKey from '../utils/getKey';
import Errors from '../utils/Errors';
import ensureInstanceNumber from '../utils/ensureInstanceNumber';
import { getPidFile, writePid, removePidFile } from '../utils/PidHelpers';
import {
	startServer,
	getSocketPath,
	removeDomainSocket,
} from '../utils/SocketsHelpers';

export default class MasterMonitor extends EventEmitter {
	// will be set by server socket
	currentWorkerMonitor = null;

	constructor(options) {
		super();

		const {
			workspace: space,
			logsDir,
			execPath,
			spawnArgs,
			daemon,
			env,
			monitorProcessTitle,
			baseDir: cwd,
			production,
			name,
			events,
			watch: watchOptions,
			...respawnOptions
		} = options;

		setLoggers({
			...options,
			enable: !daemon || logsDir,
			logsDir: logsDir || '.logs',
		});

		workspace.set(space);
		process.title = monitorProcessTitle;

		this._workerMonitorOptions = {
			stdio: 'pipe',
			...respawnOptions,
			execPath,
			execArgv: spawnArgs,
			data: options,
			env: (function () {
				const res = { ...env };
				if (!res.NODE_ENV) {
					res.NODE_ENV = production ? 'production' : 'development';
				}
				res[ENV_VAR_KEY] = JSON.stringify(options);
				return res;
			})(),
		};

		const eventsLogger = ensureLogger('events', 'gray');
		const runScript = createScriptRunner({ cwd, logger: eventsLogger });

		this._runEvent = (event, ...args) => {
			const hook = events[event];
			if (hook) {
				const prefix = [event]
					.concat(args)
					.filter(Boolean)
					.join(' ');
				eventsLogger.info(chalk.gray(`${prefix} - ${hook}`));
				runScript(event, ...args);
			}
		};

		this.workerMonitors = [];

		const exit = async () => {
			logger.debug('exit');
			try {
				const connection = await Connection.getByName(name);
				if (connection) {
					await connection.requestStopServer();
				}
				await Promise.all(
					this.workerMonitors.map(async (monitor) => monitor.stop()),
				);
			}
			catch (err) {
				logger.debug(err);
			}
			process.exit();
		};

		process.on('uncaughtException', async (err) => {
			logger.fatal(err);
			await exit();
		});

		onSignalExit(async () => {
			setLoggers('logLevel', 'OFF');
			await exit();
		});

		watch({ cwd, ...watchOptions }, async () => {
			logger.trace('watch:restart');
			process.emit('watch:restart');
			const { length } = this.workerMonitors;
			const reloadDelay = length > 1 ? 2000 / length : 0;
			for (const workerMonitor of this.workerMonitors) {
				await workerMonitor.restart();
				await delay(reloadDelay);
			}
		});
	}

	async spawn(options = {}) {
		const newInstances = ensureInstanceNumber(options.instances);
		const { EventTypes } = WorkerMonitor;
		const runEvent = this._runEvent;

		const workerMonitors = new Array(newInstances)
			.fill()
			.map(() => new WorkerMonitor(this._workerMonitorOptions));

		const errors = new Errors();

		const bootstraps = workerMonitors.map((workerMonitor) => {
			let displayName = workerMonitor.data.name;

			workerMonitor.on(EventTypes.STOP, () => {
				logger.warn(`"${displayName}" stopped`);
				runEvent(EventTypes.STOP);
			});

			workerMonitor.on(EventTypes.CRASH, () => {
				logger.fatal(`"${displayName}" crashed`);
				runEvent(EventTypes.CRASH);
			});

			workerMonitor.on(EventTypes.SLEEP, () => {
				logger.warn(`"${displayName}" sleeped`);
				runEvent(EventTypes.SLEEP);
			});

			workerMonitor.on(EventTypes.SPAWN, () => {
				runEvent(EventTypes.SPAWN);
			});

			workerMonitor.on(EventTypes.EXIT, async (code, signal) => {
				logger.debug(
					`"${displayName}" exit with code "${code}", signal "${signal}"`,
				);
				runEvent(EventTypes.EXIT, code, signal);
			});

			workerMonitor.on(EventTypes.STDOUT, (data) => {
				runEvent(EventTypes.STDOUT);
				logger.info(data.toString().trim());
			});

			workerMonitor.on(EventTypes.STDERR, (data) => {
				runEvent(EventTypes.STDERR);
				logger.error(data.toString().trim());
			});

			workerMonitor.on(EventTypes.WARN, (data) => {
				runEvent(EventTypes.WARN);
				logger.warn(data.toString().trim());
			});

			workerMonitor.on(EventTypes.RESTART, async () => {
				await writePid(workerMonitor.data);
				logger.info(`"${displayName}" restarted`);
				runEvent(EventTypes.RESTART);
			});

			return new Promise((resolve) => {
				workerMonitor.on(EventTypes.START, async () => {
					try {
						const { workerMonitors } = this;
						const numbers = workerMonitors.length ?
							workerMonitors.map((wm) => wm.id) :
							[0];
						workerMonitor.id = Math.max(...numbers) + 1;
						workerMonitors.push(workerMonitor);

						const { data: options, id } = workerMonitor;
						workspace.set(options);

						const key = getKey(workerMonitor);
						const pidFile = await getPidFile(key);
						const socketPath = await getSocketPath(key);

						options.instanceId = id;
						options.key = key;
						options.pidFile = pidFile;
						options.socketPath = socketPath;
						options.displayName = options.name + (id ? ` #${id}` : '');

						await startServer(this, workerMonitor);
						await writePid(options);

						workerMonitors.sort((a, b) => a.id - b.id);

						displayName = workerMonitor.data.displayName;
						logger.info(`"${displayName}" started`);
						runEvent(EventTypes.START);
					}
					catch (err) {
						logger.debug(err);
						errors.push(err);
					}
					resolve(workerMonitor.toJSON());
				});
				workerMonitor.start();
			});
		});

		const added = await Promise.all(bootstraps);

		const ok = bootstraps.length > errors.length;
		return {
			ok,
			errors: errors.toJSON(),
			added,
		};
	}

	async scale(number) {
		const delta = ensureInstanceNumber(number) - this.workerMonitors.length;
		if (!delta) {
			return { ok: true, errors: [] };
		}
		else if (delta > 0) {
			return this.spawn({ instances: delta });
		}
		else {
			const { workerMonitors } = this;
			const toRemove = workerMonitors.slice(workerMonitors.length + delta);
			const errors = new Errors();
			const removed = await Promise.all(
				toRemove.map(async (workerMonitor) => {
					const state = workerMonitor.toJSON();
					await this.requestShutDown(workerMonitor).catch((err) =>
						errors.push(err),
					);
					return state;
				}),
			);
			return {
				ok: !errors.length,
				errors: errors.toJSON(),
				removed,
			};
		}
	}

	async state(newState) {
		const { currentWorkerMonitor } = this;
		if (currentWorkerMonitor) {
			if (newState) {
				Object.assign(currentWorkerMonitor.data, newState);
			}
			return currentWorkerMonitor.toJSON();
		}
	}

	async restart() {
		const { currentWorkerMonitor } = this;
		if (currentWorkerMonitor) {
			await currentWorkerMonitor.restart();
			return true;
		}
		return false;
	}

	async requestShutDown(workerMonitor = this.currentWorkerMonitor) {
		await workerMonitor.stop();

		const { socketPath, pidFile } = workerMonitor.toJSON();

		const { workerMonitors } = this;
		const index = workerMonitors.indexOf(workerMonitor);
		workerMonitors.splice(index, 1);
		await Promise.all([removeDomainSocket(socketPath), removePidFile(pidFile)]);

		if (!workerMonitors.length) process.exit(0);
	}
}
