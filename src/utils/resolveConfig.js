import { merge } from 'lodash';
import importFile from 'import-file';
import { isAbsolute } from 'path';

export default function resolveConfig(argv = {}, configFile, options = {}) {
	if (configFile !== false) {
		const { merge: mergeConfig = merge, ...importOptions } = options;
		const useFindUp = !isAbsolute(configFile);
		try {
			const config = importFile(configFile, { useFindUp, ...importOptions });
			return mergeConfig(config, argv);
		}
		catch (err) {
			if (err && err.errno !== 'ENOENT') {
				throw err;
			}
		}
	}
	return argv;
}
