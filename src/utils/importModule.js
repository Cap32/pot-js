
import { join } from 'path';
import { isString } from 'lodash';

const importES6Module = (modulePath) => {
	const module = require(modulePath);
	return module.default || module;
};

const resolveFromPaths = (paths) => {
	let error;

	const tryResolve = (path) => {
		try { return require.resolve(path); }
		catch (err) { error = err; }
	};

	const resolvedPath = paths.find(tryResolve);

	if (resolvedPath) { return resolvedPath; }
	else { throw error; }
};

export default function importModule(modulePath, options = {}) {
	if (!isString(modulePath)) {
		throw new Error(
			`modulePath must be a string. Received ${typeof modulePath}`
		);
	}

	const { root, prefer } = options;

	const paths = [modulePath];

	root && paths.unshift(join(root, modulePath));
	prefer && paths.unshift(join(prefer, modulePath));

	const resolvedPath = resolveFromPaths(paths);
	return importES6Module(resolvedPath);
}
