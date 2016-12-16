
import { unlink } from 'fs-promise';
import logger from './utils/logger';
import { setUpWorkspace } from './utils/config';
import { getPid, getPidFile } from './utils/monitorHelper';

const stop = async (options = {}) => {
	const { name } = setUpWorkspace(options);
	const pidFile = await getPidFile(name);

	const pid = await getPid(pidFile);

	if (!pid) {
		throw new Error(`"${name}" not found.`);
	}

	try { await unlink(pidFile); }
	catch (err) { logger.debug(err); }

	try { process.kill(pid); }
	catch (err) { logger.debug(err); }
};

export default stop;
