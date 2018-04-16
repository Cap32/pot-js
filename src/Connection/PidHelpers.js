import processExists from 'process-exists';
import { writeFile, readFile, exists, remove } from 'fs-extra';
import workspace from '../utils/workspace';
import { basename, join } from 'path';
import { trim, noop } from 'lodash';
import globby from 'globby';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import fkill from 'fkill';
import isWin from '../utils/isWin';

const removePidFile = async function removePidFile(pidFile) {
	logger.trace('remove pid file', pidFile);
	return remove(pidFile).catch(noop);
};

const getPid = async function getPid(pidFile) {
	const isFileExists = await exists(pidFile);
	if (isFileExists) {
		const pid = +trim(await readFile(pidFile, 'utf-8'));
		const isProcessExists = await processExists(pid);
		if (!isProcessExists) {
			removePidFile(pidFile);
		}
		return isProcessExists && pid;
	}
	return false;
};

const parsePidFile = async function parsePidFile(pidFile) {
	const pid = await getPid(pidFile);
	const name = basename(pidFile, '.pid');
	if (!pid) {
		return false;
	}
	return { pid, name, pidFile };
};

export { removePidFile };

export async function getPidFile(name) {
	const runDir = await workspace.getRunDir();
	return join(runDir, `${name}.pid`);
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

export async function killPid(name, pid, options = {}) {
	try {
		const { shouldLog } = options;
		await fkill(pid, { force: isWin });
		logger.trace(`killed pid ${pid}`);
		shouldLog && logger.info(`"${name}" stopped`);
		return true;
	}
	catch (err) {
		logger.error(`Stop "${name}" failed.`);
		logger.debug(err);
		return false;
	}
}

export async function writePid({ pidFile, parentPid }) {
	logger.trace('pid file saved in', chalk.gray(pidFile));
	await writeFile(pidFile, parentPid).catch((err) => logger.debug(err));
}
