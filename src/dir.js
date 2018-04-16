import Connection from './Connection';
import ensureSelected from './utils/ensureSelected';
import workspace from './utils/workspace';
import validateBySchema from './utils/validateBySchema';
import { restart as schema } from './schemas/cli';

export default async function dir(options = {}) {
	validateBySchema(schema, options);
	workspace.set(options);

	const { name } = options;

	const appName = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running.',
		getChoices: Connection.getNames,
	});

	const connection = await Connection.getByName(appName);

	if (!connection) {
		throw new Error(`"${appName}" NOT found`);
	}

	const state = await connection.getState();
	const { cwd } = state;
	console.log(cwd);
}
