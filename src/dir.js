import Connection from './Connection';
import ensureSelected from './utils/ensureSelected';
import workspace from './utils/workspace';

const dir = async (options) => {
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

	const info = await connection.getInfo();
	const { cwd, root } = info.data;

	console.log(cwd || root);
};

export default dir;
