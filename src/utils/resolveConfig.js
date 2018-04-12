import { merge } from 'lodash';
import importFile from 'import-file';
import { isAbsolute } from 'path';

export default function resolveConfig(cliOptions = {}) {
	const { config: configFile, configWalk } = cliOptions;
	const useFindUp = configWalk && !isAbsolute(configFile);

	if (configFile) {
		try {
			const config = importFile(configFile, { useFindUp });
			return merge(config, cliOptions);
		}
		catch (err) {}
	}
	return cliOptions;
}
