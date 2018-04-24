import * as Schemas from './schemas/cli';
import * as Operators from './';

export const start = {
	command: 'start [entry]',
	description: 'Spawn and monitor a process',
	schema: Schemas.start,
	operator: Operators.start,
	configFile: 'config',
};

export const restart = {
	command: 'restart [name]',
	description: 'Restart a process',
	schema: Schemas.restart,
	operator: Operators.restart,
};

export const restartAll = {
	command: 'restartall',
	description: 'Restart all processes',
	schema: Schemas.restartAll,
	operator: Operators.restartAll,
};

export const reload = {
	command: 'reload [name]',
	description: 'Reload a process',
	schema: Schemas.reload,
	operator: Operators.reload,
};

export const reloadAll = {
	command: 'reloadall',
	description: 'Reload all processes',
	schema: Schemas.reloadAll,
	operator: Operators.reloadAll,
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
	schema: Schemas.stopAll,
	operator: Operators.stopAll,
};

export const scale = {
	command: 'scale <name> <instances>',
	description: 'Scale up/down a process',
	schema: Schemas.scale,
	operator: Operators.scale,
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
