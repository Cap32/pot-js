import start from './config';
import { cloneDeep } from 'lodash';

const { properties } = start;
const logLevel = cloneDeep(properties.logLevel);
const workspace = cloneDeep(properties.workspace);

export { start };

export const stop = {
	properties: {
		force: {
			alias: 'f',
			description: 'Stop without confirming',
			type: 'boolean',
		},
		logLevel,
		workspace,
	},
};

export const list = {
	properties: {
		logLevel,
		workspace,
	},
};

export const dir = list;

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
		workspace,
	},
};
