import processExists from 'process-exists';
import { writeFile, readFile, open, remove } from 'fs-extra';
import { basename, join } from 'path';
import { trim } from 'lodash';
import globby from 'globby';
import { logger } from 'pot-logger';
import chalk from 'chalk';
import fkill from 'fkill';

const checkIsPidFileExists = async (pidFile) => {
	try {
		return !!await open(pidFile, 'r');
	}
	catch (err) {
		return false;
	}
};

const getPid = async function getPid(pidFile) {
	const isFileExists = await checkIsPidFileExists(pidFile);
	if (isFileExists) {
		const pid = +trim(await readFile(pidFile, 'utf-8'));
		const isProcessExists = await processExists(pid);
		if (!isProcessExists) {
			await remove(pidFile);
		}
		return isProcessExists && pid;
	}
	return false;
};

const parsePidFile = async function parsePidFile(pidFile) {
	const pid = await getPid(pidFile);
	const name = basename(pidFile, '.pid');
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
	return Promise.all(pidFiles.map(parsePidFile));
}

export async function killPid(name, pid, pidFile, options = {}) {

	// if (!this.isRunning) {
	// 	throw new Error('pid is not running');
	// }

	try {
		const { shouldLog } = options;

		try {
			await remove(pidFile);
		}
		catch (err) {
			logger.debug(err);
		}

		await fkill(pid);

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

export async function writePid(pidFile, pid) {
	logger.trace('pid file saved in', chalk.gray(pidFile));
	await writeFile(pidFile, pid);
}
