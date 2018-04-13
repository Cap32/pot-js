import createCommand from './createCommand';
import yargs from 'yargs';
import { isObject, map } from 'lodash';

export default function createCli(getYargs, commands, options = {}) {
	const instance = getYargs(yargs);
	if (!Array.isArray(commands) && isObject(commands)) {
		commands = map(commands);
	}
	if (Array.isArray(commands)) {
		commands.forEach((localOptions) =>
			instance.command(
				createCommand({
					...options,
					...localOptions,
				}),
			),
		);
	}
	return instance.argv;
}
