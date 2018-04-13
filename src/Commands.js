import * as Schemas from './schemas/cli';
import * as Operators from './';

export const start = {
	command: 'start [entry]',
	description: 'Spawn and monitor a process',
	schema: Schemas.start,
	operator: Operators.start,
	configFile: 'config',
	validate: false,
};

export const stop = {
	command: 'stop [name]',
	description: 'Stop a process',
	schema: Schemas.stop,
	operator: Operators.stop,
};

export const stopall = {
	command: 'stopall',
	description: 'Stop all processes',
	schema: Schemas.stop,
	operator: Operators.stopAll,
};

export const list = {
	command: 'list',
	aliases: ['ls'],
	description: 'List processes',
	schema: Schemas.list,
	operator: Operators.list,
};

export const log = {
	command: 'log [name]',
	description: 'Show log',
	schema: Schemas.log,
	operator: Operators.log,
};

export const dir = {
	command: 'dir [name]',
	description: 'Show dir',
	schema: Schemas.dir,
	operator: Operators.dir,
};