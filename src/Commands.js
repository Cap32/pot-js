import * as Schemas from './schemas/cli';
import * as Operators from './';

export const start = {
	command: 'start [entry] [options]',
	description: 'Spawn and monitor a process',
	getBuild(yargs, { entry, ...options }) {
		return yargs
			.usage('$0 start [entry] [options]')
			.positional('entry', entry)
			.options(options).argv;
	},
	schema: Schemas.start,
	operator: Operators.start,
	middlewares: [
		function potTrick(argv) {
			return argv;
		},
	],
};

export const stop = {
	command: 'stop [name] [options]',
	description: 'Stop a process',
	schema: Schemas.stop,
	operator: Operators.stop,
};

export const stopall = {
	command: 'stopall [options]',
	description: 'Stop all processes',
	schema: Schemas.stop,
	operator: Operators.stopAll,
};

export const list = {
	command: 'list [options]',
	aliases: ['ls'],
	description: 'List processes',
	schema: Schemas.list,
	operator: Operators.list,
};

export const log = {
	command: 'log [name] [options]',
	description: 'Show log',
	schema: Schemas.log,
	operator: Operators.log,
};

export const dir = {
	command: 'dir [name] [options]',
	description: 'Show dir',
	schema: Schemas.dir,
	operator: Operators.dir,
};
