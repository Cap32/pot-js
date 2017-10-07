
import chokidar from 'chokidar';
import { debounce } from 'lodash';
import { createLogger } from 'pot-logger';

const logger = createLogger('watch');

export default function watch(options = {}, handler) {
	const {
		enable = true,
		dirs = ['**/*'],
		ignoreDotFiles = true,
		ignoreNodeModulesDir = true,
		...other,
	} = options;

	if (!enable) { return; }

	logger.trace('enabled');

	let { ignored } = other;
	ignored = ignored ? [].concat(ignored) : [];

	if (ignoreDotFiles) {
		logger.trace('dot files ignored');
		ignored.push(/(^|[/\\])\../);
	}

	if (ignoreNodeModulesDir) {
		logger.trace('node_modules dir ignored');
		ignored.push('node_modules/**/*');
	}

	chokidar.watch(dirs, {
		...other,
		ignored,
		usePolling: true,
		ignoreInitial: true,
	}).on('all', debounce(handler, 1000));
}
