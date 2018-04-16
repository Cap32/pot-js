import start from './config';
import { cloneDeep } from 'lodash';

const { properties } = start;
const logLevel = cloneDeep(properties.logLevel);
const workspace = cloneDeep(properties.workspace);
const name = cloneDeep(properties.name);

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

export const restart = stop;

export const list = {
	properties: {
		logLevel,
		workspace,
	},
};

export const dir = {
	properties: {
		logLevel,
		name,
		workspace,
	},
};

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
