import createCommand from './createCommand';
import yargs from 'yargs';
import { isObject, map } from 'lodash';

export default function createCli(getYargs, commands) {
	const instance = getYargs(yargs);
	if (!Array.isArray(commands) && isObject(commands)) {
		commands = map(commands);
	}
	if (Array.isArray(commands)) {
		commands.forEach((options) => instance.command(createCommand(options)));
	}
	return instance.argv;
}
