import { setLoggers } from 'pot-logger';
import inquirer from 'inquirer';
import Connection from '../Connection';
import workspace from './workspace';
import validateBySchema from './validateBySchema';

export async function ensureArg(options) {
	const { value, errorMessage, getChoices, type = 'list', ...other } = options;
	if (value) return value;

	const promptOptions = { name: 'value', type, ...other };
	if (type === 'list') {
		const choices = await getChoices();
		if (!choices.length) throw new Error(errorMessage);
		if (choices.length === 1) return choices[0];
		promptOptions.choices = choices;
	}
	const anweser = await inquirer.prompt(promptOptions);
	return anweser.value;
}

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

export async function prepareTarget(argv = {}, options = {}) {
	const { name } = argv;
	const targetName = await ensureArg({
		value: name,
		message: 'Please select the target app',
		errorMessage: 'No process is running',
		getChoices: Connection.getNames,
	});

	const { noConnection, ...connectionOption } = options;
	if (noConnection) return { targetName };

	const connection = await Connection.getByName(targetName, connectionOption);
	if (!connection || !connection.instances.length) {
		throw new Error(`"${targetName}" NOT found`);
	}
	return { connection, targetName };
}
