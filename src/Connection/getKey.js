import { isString } from 'lodash';

export default function getKey(monitor) {
	if (isString(monitor)) return monitor;
	else if (!monitor || !monitor.data) return;

	const { data: { name = '-' }, worker } = monitor;
	const normalizedName = name.replace(/\W/g, '-');
	const id = worker && worker.id;
	return [normalizedName, id].filter(Boolean).join('-');
}
