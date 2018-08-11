import { setLoggers } from 'pot-logger';
import inquirer from 'inquirer';
import Pot from '../core/Pot';
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

const unhandledRejection = function unhandledRejection(reason, promise) {
	console.warn('unhandledRejection: ' + reason);
	console.error(promise);
};

export function prepareRun(schema, argv) {
	if (process.env.NODE_ENV !== 'production') {
		process.removeListener('unhandledRejection', unhandledRejection);
		process.on('unhandledRejection', unhandledRejection);
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
		getChoices: Pot.getNames,
	});

	const { noPot } = options;
	if (noPot) return { targetName };

	const pot = await Pot.getByName(targetName);
	if (!pot || !pot.instances.length) {
		throw new Error(`"${targetName}" NOT found`);
	}
	return { pot, targetName };
}
