import processExists from 'process-exists';
import { writeFile, readFile, remove } from 'fs-extra';
import workspace from '../utils/workspace';
import { basename, join } from 'path';
import { trim, noop } from 'lodash';
import globby from 'globby';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import fkill from 'fkill';
import isWin from '../utils/isWin';
import getKey from './getKey';

const removePidFile = async function removePidFile(pidFile) {
	logger.trace('remove pid file', pidFile);
	return remove(pidFile).catch(noop);
};

const getPid = async function getPid(pidFile) {
	try {
		const pid = +trim(await readFile(pidFile, 'utf-8'));
		const isProcessExists = await processExists(pid);
		if (!isProcessExists) {
			removePidFile(pidFile);
		}
		return isProcessExists && pid;
	}
	catch (err) {
		return false;
	}
};

const parsePidFile = async function parsePidFile(pidFile) {
	const pid = await getPid(pidFile);
	const key = basename(pidFile, '.pid');
	if (!pid) return false;
	return { key, pidFile };
};

export { removePidFile };

export async function getPidFile(keyOrMonitor) {
	const key = getKey(keyOrMonitor);
	const runDir = await workspace.getRunDir();
	return join(runDir, `${key}.pid`);
}

export async function getPids() {
	const runDir = await workspace.getRunDir();

	// DEPRECATED: workspace.DEPRECATED_getPidsDir()
	const deprecatedPidsDir = await workspace.DEPRECATED_getPidsDir();

	const patterns = [`${runDir}/*.pid`, `${deprecatedPidsDir}/*.pid`];
	const pidFiles = await globby(patterns, { absolute: true });
	const pids = await Promise.all(pidFiles.map(parsePidFile));
	return pids.filter(Boolean);
}

export async function killPid(key, ppid, options = {}) {
	try {
		const { shouldLog } = options;
		await fkill(ppid, { force: isWin });
		logger.trace(`killed pid ${ppid}`);
		shouldLog && logger.info(`"${key}" stopped`);
		return true;
	}
	catch (err) {
		logger.error(`Stop "${key}" failed.`);
		logger.debug(err);
		return false;
	}
}

export async function writePid({ pidFile, pid }) {
	logger.trace('pid file saved in', chalk.gray(pidFile));
	await writeFile(pidFile, pid).catch((err) => logger.debug(err));
}
