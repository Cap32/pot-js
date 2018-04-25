import createCommand from './createCommand';
import yargs from 'yargs';
import { isObject, isFunction, map } from 'lodash';

export default function createCli(getYargs, commands, options = {}) {
	const instance = (function () {
		if (isObject(getYargs) && getYargs.version) {
			const pkg = getYargs;
			getYargs = (yargs) =>
				yargs
					.usage('$0 <command> [options]')
					.demand(1, 'Please specify one of the commands!')
					.alias('h', 'help')
					.help()
					.version(pkg.version)
					.env(pkg.name.toUpperCase())
					.recommendCommands();
		}

		if (isFunction(getYargs)) {
			return getYargs(yargs);
		}
		else if (isObject(getYargs) && getYargs.name && getYargs.version) {
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
		return yargs;
	})();

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
