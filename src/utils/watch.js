
import chokidar from 'chokidar';
import { debounce } from 'lodash';
import logger from './logger';
import { Defaults } from './resolveConfig';

export default function watch(options = {}, handler) {
	const {
		enable = Defaults.WATCH,
		dirs = Defaults.WATCH_DIRS,
		ignoreDotFiles = Defaults.WATCH_IGNORE_DOT_FILES,
		ignoreNodeModulesDir = Defaults.WATCH_IGNORE_NODE_MODULE_DIR,
		...other,
	} = options;

	if (!enable) { return; }

	logger.trace('[watch] enabled');

	let { ignored } = other;
	ignored = ignored ? [].concat(ignored) : [];

	if (ignoreDotFiles) {
		logger.trace('[watch] dot files ignored');
		ignored.push(/(^|[/\\])\../);
	}

	if (ignoreNodeModulesDir) {
		logger.trace('[watch] node_modules dir ignored');
		ignored.push('node_modules/**/*');
	}

	chokidar.watch(dirs, {
		...other,
		ignored,
		usePolling: true,
		ignoreInitial: true,
	}).on('all', debounce(handler, 1000));
}
