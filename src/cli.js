import yargs from 'yargs';
import { name, version } from '../package.json';
import { upperCase } from 'lodash';
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
	.env(upperCase(name))
	.alias('h', 'help')
	.wrap(yargs.terminalWidth())
	.help()
	.version(version).argv;
