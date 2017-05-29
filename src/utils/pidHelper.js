
import { writeFile, readFile, open, unlink } from 'fs-extra';
import processExists from 'process-exists';
import { join } from 'path';
import { trim } from 'lodash';
import workspace from './workspace';

export const getPidFile = async (name) =>
	join(await workspace.getPidsDir(), `${name}.pid`)
;

export const writePidFile = writeFile;

const checkIsPidFileExists = async (pidFile) => {
	try { return !!await open(pidFile, 'r'); }
	catch (err) { return false; }
};

export const getPid = async (pidFile) => {
	const isFileExists = await checkIsPidFileExists(pidFile);
	if (isFileExists) {
		const pid = +trim(await readFile(pidFile, 'utf-8'));
		const isProcessExists = await processExists(pid);
		if (!isProcessExists) { await unlink(pidFile); }
		return isProcessExists && pid;
	}
	return false;
};
