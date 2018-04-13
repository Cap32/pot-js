import { version } from '../package.json';
import createCli from './utils/createCli';
import * as Commands from './Commands';

createCli(
	(yargs) =>
		yargs
			.usage('$0 <command> [options]')
			.demand(1, 'Please specify one of the commands!')
			.alias('h', 'help')
			.help()
			.version(version)
			.env('POT')
			.recommendCommands(),
	Commands,
);
