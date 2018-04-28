import { merge as lodashMerge } from 'lodash';
import importFile from 'import-file';
import { isAbsolute } from 'path';

export default function resolveConfig(argv = {}, key, schema, options = {}) {
	const defaultVal =
		schema &&
		schema.properties &&
		schema.properties[key] &&
		schema.properties[key].default;
	let useDefault = false;
	let configFile = argv[key];
	if (configFile === undefined && defaultVal !== undefined) {
		useDefault = true;
		configFile = defaultVal;
	}
	if (configFile !== false) {
		const { merge = lodashMerge, ...importOptions } = options;
		const useFindUp = !isAbsolute(configFile);
		try {
			const config = importFile(configFile, { useFindUp, ...importOptions });
			return merge(config, argv);
		}
		catch (err) {
			if (err && (!useDefault || err.errno !== 'ENOENT')) {
				throw err;
			}
		}
	}
	return argv;
}
