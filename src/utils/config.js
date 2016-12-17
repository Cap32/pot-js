
import { resolve, sep } from 'path';
import workspace from './workspace';

export const setUpWorkspace = (config = {}) => {
	if (config.workspace) {
		workspace.set(config.workspace);
	}
	return config;
};

export const ensureName = (config = {}) => {
	if (config.name) { return config; }

	const { root } = config;

	try {
		const { name } = require(resolve(root, 'package.json'));
		if (!name) { throw new Error(); }
		config.name = name;
		return config;
	}
	catch (err) {
		const sepRegExp = new RegExp(sep, 'g');
		return root.replace(sepRegExp, '_');
	}
};
