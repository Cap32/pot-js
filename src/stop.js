
import { unlink } from 'fs-promise';
import logger from './utils/logger';
import workspace from './utils/workspace';
import { getPid, getPidFile } from './utils/pidHelper';
import { requestByName, getNames } from './utils/socketsHelper';
import ensureSelected from './utils/ensureSelected';
import inquirer from 'inquirer';

const stop = async (options = {}) => {
	let { name } = options;
	const { force } = options;

	workspace.set(options);

	name = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running.',
		getChoices: getNames,
	});

	if (!force) {
		const confirmed = await inquirer.prompt({
			type: 'confirm',
			name: 'yes',
			message: `Are you sure stop "${name}"?`,
			default: false,
		});

		if (!confirmed.yes) {
			return;
		}
	}

	const pidFile = await getPidFile(name);

	const pid = await getPid(pidFile);

	const success = () => logger.info(`"${name}" stopped.`);
	const fail = () => logger.info(`Stop "${name}" failed.`);

	if (pid) {
		try { await unlink(pidFile); }
		catch (err) { logger.debug(err); }

		try {
			process.kill(pid);
			success();
		}
		catch (err) {
			logger.debug(err);
			fail();
		}

		return;
	}

	const info = await requestByName(name, 'info');

	if (info && info.data && info.data.parentPid) {
		try {
			process.kill(info.data.parentPid);
			success();
		}
		catch (err) {
			logger.debug(err);
			fail();
		}
	}
	else {
		throw new Error(`"${name}" not found.`);
	}

};

export default stop;
