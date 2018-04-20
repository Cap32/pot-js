import start from './config';
import { cloneDeep, omit } from 'lodash';

const { properties } = start;
const logLevel = cloneDeep(properties.logLevel);
const workspace = cloneDeep(properties.workspace);
const name = cloneDeep(properties.name);
const instances = cloneDeep(properties.instances);

export { start };

export const stop = {
	properties: {
		force: {
			alias: 'f',
			description: 'Stop without confirming',
			type: 'boolean',
		},
		logLevel,
		name,
		workspace,
	},
};

export const stopAll = {
	properties: omit(stop.properties, ['name']),
};

export const restart = {
	properties: {
		logLevel,
		name,
		workspace,
	},
};

export const restartAll = {
	properties: omit(restart.properties, ['name']),
};

export const reload = {
	properties: {
		...restart.properties,
		delay: {
			description: 'Reload delay',
			type: 'number',
			default: 5000,
		},
	},
};

export const reloadAll = {
	properties: omit(reload.properties, ['name']),
};

export const scale = {
	properties: {
		logLevel,
		name,
		workspace,
		instances,
	},
};

export const list = {
	properties: {
		logLevel,
		workspace,
	},
};

export const dir = restart;

export const log = {
	properties: {
		category: {
			alias: 'c',
			description: 'Log category',
			type: 'string',
		},
		follow: {
			alias: 'f',
			description: 'Follow mode. Just like `tail -f`',
			type: 'boolean',
		},
		line: {
			alias: 'n',
			description: 'Max lines.',
			type: 'number',
			default: 200,
		},
		logLevel,
		name,
		workspace,
	},
};
