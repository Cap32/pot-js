
import chokidar from 'chokidar';
import { debounce } from 'lodash';
import logger from './logger';
import { Defaults } from './resolveConfig';

export default function watch(options, handler) {
	const {
		enable = Defaults.WATCH,
		dirs = Defaults.WATCH_DIRS,
		ignoreDotFiles = Defaults.WATCH_IGNORE_DOT_FILES,
		...other,
	} = options;

	if (!enable) { return; }

	logger.trace('watch enabled');

	if (ignoreDotFiles) {
		logger.trace('watch ignoreDotFiles');
		other.ignored = /(^|[\/\\])\../;
	}

	chokidar.watch(dirs, {
		...other,
		usePolling: true,
		ignoreInitial: true,
	}).on('all', debounce(handler, 1000));
}
