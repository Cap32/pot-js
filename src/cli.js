import yargs from 'yargs';
import { version } from '../package.json';
import * as Commands from './Commands';

// eslint-disable-next-line
yargs
	.usage('$0 <command> [options]')
	.demand(1, 'Please specify one of the commands!')
	.command(Commands.start)
	.command(Commands.stop)
	.command(Commands.stopall)
	.command(Commands.list)
	.command(Commands.log)
	.command(Commands.dir)
	.alias('h', 'help')
	.help()
	.version(version)
	.env('POT')
	.locale('en')
	.recommendCommands()
	.wrap(70).argv;
