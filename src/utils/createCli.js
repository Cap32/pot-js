import createCommand from './createCommand';
import yargs from 'yargs';
import { isObject, isFunction, map } from 'lodash';

export default function createCli(getYargs, commands, options = {}) {
	const args = (function () {
		if (isObject(getYargs) && getYargs.name && getYargs.version) {
			const pkg = getYargs;
			return yargs
				.usage('$0 <command> [options]')
				.demand(1, 'Please specify one of the commands!')
				.alias('h', 'help')
				.help()
				.version(pkg.version)
				.env(pkg.name.toUpperCase())
				.recommendCommands();
		}
		else if (isFunction(getYargs)) {
			return getYargs(yargs);
		}
	})();

	if (!Array.isArray(commands) && isObject(commands)) {
		commands = map(commands);
	}
	if (Array.isArray(commands)) {
		commands.forEach((localOptions) =>
			args.command(
				createCommand({
					...options,
					...localOptions,
				}),
			),
		);
	}
	return args.argv;
}
