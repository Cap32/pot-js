
export const resolveES6 = (path) => {
	const module = require(path);
	return module.default || module;
};

export const resolveFromPaths = (paths) => {
	let error;

	const tryResolve = (path) => {
		try { return require.resolve(path); }
		catch (err) { error = err; }
	};

	const resolvedPath = paths.find(tryResolve);

	if (resolvedPath) { return resolvedPath; }
	else { throw error; }
};
