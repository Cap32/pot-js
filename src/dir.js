
import { requestByName, getNames } from './utils/socketsHelper';
import ensureSelected from './utils/ensureSelected';
import workspace from './utils/workspace';

const dir = async (options) => {
	workspace.set(options);

	const { name } = options;

	const appName = await ensureSelected({
		value: name,
		message: 'Please select the target app.',
		errorMessage: 'No process is running.',
		getChoices: getNames,
	});

	const info = await requestByName(appName, 'info');
	if (!info) {
		throw new Error(`"${appName}" is NOT found.`);
	}

	const { root } = info.data;

	console.log(root);
};

export default dir;
