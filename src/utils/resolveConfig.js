import { merge } from 'lodash';
import importFile from 'import-file';
import { isAbsolute } from 'path';

export default function resolveConfig(cliOptions = {}, configFileKey) {
	const configFile = cliOptions[configFileKey];
	if (configFile) {
		const useFindUp = !isAbsolute(configFile);
		try {
			const config = importFile(configFile, { useFindUp });
			return merge(config, cliOptions);
		}
		catch (err) {
			delete cliOptions[configFileKey];
		}
	}
	return cliOptions;
}
