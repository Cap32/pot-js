
import { merge } from 'lodash';
import importFile from 'import-file';
import { isAbsolute } from 'path';

export const Defaults = {
	ENTRY: 'index.js',
	EXEC_COMMAND: process.execPath,
	LOG_LEVEL: 'INFO',
	LOGS_DIR: '.logs',
	WATCH: false,
	WATCH_DIRS: ['**/*'],
	WATCH_IGNORE_DOT_FILES: true,
	WATCH_IGNORE_NODE_MODULE_DIR: true,
};

export default function resolveConfig(options = {}) {
	const { config, configWalk } = options;
	const useFindUp = configWalk && !isAbsolute(config);

	if (config) {
		try {
			const configJSON = importFile(config, { useFindUp });
			return merge(options, configJSON);
		}
		catch (err) {}
	}

	return options;
}
