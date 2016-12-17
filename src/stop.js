
import { unlink } from 'fs-promise';
import logger from './utils/logger';
import { setUpWorkspace } from './utils/config';
import { getPid, getPidFile } from './utils/pidHelper';
import { requestByName } from './utils/socketsHelper';

const stop = async (options = {}) => {
	const { name } = setUpWorkspace(options);
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

	if (info && info.parentPid) {
		try {
			process.kill(info.parentPid);
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
