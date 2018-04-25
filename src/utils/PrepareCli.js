import { setLoggers } from 'pot-logger';
import Connection from '../Connection';
import ensureSelected from './ensureSelected';
import workspace from './workspace';
import validateBySchema from './validateBySchema';

export function prepareRun(schema, argv) {
	if (process.env !== 'production') {
		process.on('unhandledRejection', (reason, promise) => {
			console.warn('unhandledRejection: ' + reason);
			console.error(promise);
		});
	}

	validateBySchema(schema, argv);
	workspace.set(argv);
	setLoggers('logLevel', argv.logLevel);
}

export async function prepareTarget(argv, options) {
	const { name } = argv;
	const targetName = await ensureSelected({
		value: name,
		message: 'Please select the target app',
		errorMessage: 'No process is running',
		getChoices: Connection.getNames,
	});
	const connection = await Connection.getByName(targetName, options);
	if (!connection || !connection.instances.length) {
		throw new Error(`"${targetName}" NOT found`);
	}
	return { connection, targetName };
}
