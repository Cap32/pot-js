import { logger } from 'pot-logger';
import { name as pkgName } from '../../package.json';

const warns = new Set();
const defaultMessage =
	'this version has been deprecated, please upgrade to the latest version';

export default function deprecated(message = defaultMessage, name = '') {
	if (warns.has(name)) {
		return;
	}
	warns.add(name);
	logger.warn(`[${pkgName}]`, message.replace('$name', name));
}
