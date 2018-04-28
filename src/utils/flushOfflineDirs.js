import { flush } from 'pot-logger';
import globby from 'globby';
import workspace from '../utils/workspace';
import { difference } from 'lodash';
import { join } from 'path';

export default async function flushOfflineDirs(onlineNames) {
	try {
		const cwd = await workspace.getLogsDir();
		const all = await globby('*', {
			onlyDirectories: true,
			cwd,
		});
		const offlines = difference(all, onlineNames);
		await Promise.all(
			offlines.map(async (name) => {
				const logsDir = join(cwd, name);
				return flush({ logsDir, removeDir: true });
			}),
		);
	}
	catch (err) {}
}
