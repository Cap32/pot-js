import processExists from 'process-exists';
import { writeFile, readFile, exists, remove } from 'fs-extra';
import { basename, join } from 'path';
import { trim, noop } from 'lodash';
import globby from 'globby';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import fkill from 'fkill';

const removePidFile = async function removePidFile(pidFile) {
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

export function getPidFile(pidsDir, name) {
	return join(pidsDir, `${name}.pid`);
}

export async function getPids(cwd) {
	const pidFiles = await globby(['*'], {
		absolute: true,
		cwd,
	});
	const pids = await Promise.all(pidFiles.map(parsePidFile));
	return pids.filter(Boolean);
}

export async function killPid(name, pid, pidFile, options = {}) {
	try {
		const { shouldLog } = options;
		await removePidFile(pidFile);
		await fkill(pid, { force: true });
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

export async function writePid({ pidFile, monitorPid }) {
	logger.trace('pid file saved in', chalk.gray(pidFile));
	await writeFile(pidFile, monitorPid).catch((err) => logger.debug(err));
}
