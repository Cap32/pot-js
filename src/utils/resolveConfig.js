
import findUp from 'find-up';
import { readFile } from 'fs-promise';
import { merge } from 'lodash';
import JSON5 from 'json5';
import { requireES6 } from './resolve';

export const Defaults = {
	ENTRY: 'index.js',
	EXEC_COMMAND: process.execPath,
	LOG_LEVEL: 'INFO',
	LOGS_DIR: '.logs',
	WATCH: false,
	WATCH_DIRS: ['**/*'],
	WATCH_IGNORE_DOT_FILES: true,
};

export default async function resolveConfig(options = {}) {
	const { config, configWalk } = options;
	const configFile = configWalk ? await findUp(config) : config;

	const resolveModule = async (modulePath) => {
		if (modulePath.endsWith('.js')) {
			return requireES6(modulePath);
		}
		else {
			const jsonStr = await readFile(configFile, 'utf-8');
			return JSON5.parse(jsonStr);
		}
	};

	if (configFile) {
		const configJSON = await resolveModule(configFile);
		return merge(options, configJSON);
	}

	return options;
}
