import getConfig from './getConfig';
import { cloneDeep, omit } from 'lodash';

const start = getConfig();
const { properties } = start;
const logLevel = cloneDeep(properties.logLevel);
const workspace = cloneDeep(properties.workspace);
const name = cloneDeep(properties.name);
const instances = omit(properties.instances, ['default']);
const cells = { type: 'array', hidden: true };
const instance = { type: 'number' };

export { start };

export const stop = {
	properties: {
		force: {
			alias: 'f',
			description: 'Stop without confirming',
			type: 'boolean',
		},
		instance,
		logLevel,
		name,
		workspace,
	},
};

export const stopAll = {
	properties: omit(stop.properties, ['name', 'instance']),
};

export const restart = {
	properties: {
		instance,
		logLevel,
		name,
		workspace,
	},
};

export const restartAll = {
	properties: omit(restart.properties, ['name', 'instance']),
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
		instances,
		logLevel,
		name,
		workspace,
	},
};

export const list = {
	properties: {
		cells,
		logLevel,
		workspace,
	},
};

export const show = {
	properties: {
		cells,
		instance,
		logLevel,
		name,
		workspace,
	},
};

export const log = {
	properties: {
		category: {
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

export const flush = restart;
export const flushAll = restartAll;
