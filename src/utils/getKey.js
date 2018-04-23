import { isString } from 'lodash';

export default function getKey(monitor) {
	if (isString(monitor)) return monitor;
	else if (!monitor || !monitor.data) return;

	const { data: { name = '-' }, id } = monitor;
	const normalizedName = name.replace(/\W/g, '-');
	return [normalizedName, id].filter(Boolean).join('-');
}
