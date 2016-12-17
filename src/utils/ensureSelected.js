
import inquirer from 'inquirer';

export default async function ensureSelected(options) {
	const {
		value, message, errorMessage, getChoices,
	} = options;

	if (value) { return value; }

	const choices = await getChoices();

	if (!choices.length) {
		throw new Error(errorMessage);
	}

	if (choices.length === 1) {
		return choices[0];
	}

	const anweser = await inquirer.prompt({
		type: 'list',
		name: 'value',
		message,
		choices,
	});

	return anweser.value;
}
