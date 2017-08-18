
import { writeFile, readFile, open, remove } from 'fs-extra';
import processExists from 'process-exists';
import { join } from 'path';
import { trim } from 'lodash';
import { logger, setLoggers } from 'pot-logger';
import workspace from './workspace';
import isWin from './isWin';
import Bridge from '../Bridge';
import chalk from 'chalk';
import { stopServer } from './unixDomainSocket';

const getPidFile = async (name) =>
	join(await workspace.getPidsDir(), `${name}.pid`)
;

const checkIsPidFileExists = async (pidFile) => {
	try { return !!await open(pidFile, 'r'); }
	catch (err) { return false; }
};

const getPid = async (pidFile) => {
	const isFileExists = await checkIsPidFileExists(pidFile);
	if (isFileExists) {
		const pid = +trim(await readFile(pidFile, 'utf-8'));
		const isProcessExists = await processExists(pid);
		if (!isProcessExists) { await remove(pidFile); }
		return isProcessExists && pid;
	}
	return false;
};

export default class PidManager {
	static async find(name, options) {
		if (options) {
			setLoggers('logLevel', options.logLevel);
			workspace.set(options.space || name);
		}

		const pidFile = await getPidFile(name);
		const pid = await getPid(pidFile);

		if (pid) {
			logger.trace(`pid file "${pidFile}" found`);
			return new PidManager(name, { pid, pidFile, hasPidFile: true });
		}

		const bridge = await Bridge.getByName(name);

		if (bridge) {
			const info = await bridge.getInfo();
			if (info && info.data && info.data.parentPid) {
				return new PidManager(name, { pid: info.data.parentPid, pidFile });
			}
		}

		return new PidManager(name, { pidFile });
	}

	constructor(name, { pid, pidFile, hasPidFile }) {
		this.name = name;
		this.pid = pid;
		this.pidFile = pidFile;
		this.hasPidFile = hasPidFile;
	}

	get isRunning() {
		return !!this.pid;
	}

	async kill(options = {}) {
		if (!this.isRunning) {
			throw new Error('pid is not running');
		}

		try {
			const { name, pid, pidFile, hasPidFile } = this;
			const { shouldLog } = options;

			if (hasPidFile) {
				try { await remove(pidFile); }
				catch (err) { logger.debug(err); }
			}


			if (isWin) {
				await stopServer(name);
			}

			process.kill(pid);
			logger.trace(`killed pid ${pid}`);
			shouldLog && logger.info(`"${name}" stopped`);
			return true;
		}
		catch (err) {
			logger.info(`Stop "${name}" failed.`);
			logger.debug(err);
			return false;
		}
	}

	async write(pid) {
		logger.trace('pid file saved in', chalk.gray(this.pidFile));
		await writeFile(this.pidFile, pid);
		this.pid = pid;
	}
}
