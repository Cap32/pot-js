
import findUp from 'find-up';
import { readFile } from 'fs-promise';
import { merge } from 'lodash';
import JSON5 from 'json5';

export const Defaults = {
	ENTRY: 'index.js',
	EXEC_COMMAND: process.execPath,
	LOGS_DIR: '.logs',
	WATCH: false,
	WATCH_DIRS: ['**/*'],
	WATCH_IGNORE_DOT_FILES: true,
};

export default async function resolveConfig(options = {}) {
	const { config, configWalk } = options;
	const configFile = configWalk ? await findUp(config) : config;

	if (configFile) {
		const configData = await readFile(configFile, 'utf-8');
		const configJSON = JSON5.parse(configData);
		return merge(options, configJSON);
	}

	return options;
}
