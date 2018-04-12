import { merge } from 'lodash';
import importFile from 'import-file';
import { isAbsolute } from 'path';

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
