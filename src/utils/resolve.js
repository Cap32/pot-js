
import path from 'path';

export const requireES6 = (modulePath) => {
	const module = require(modulePath);
	return module.default || module;
};

export default function resolve(root, modulePath) {
	const nodeModuleRegExp = /^\w/;
	const isNodeModule = nodeModuleRegExp.test(modulePath);
	return isNodeModule ? modulePath : path.resolve(root, modulePath);
}
