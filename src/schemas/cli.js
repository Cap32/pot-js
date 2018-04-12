import base from './config';
import schemaToCliOptions from '../utils/schemaToCliOptions';

const properties = schemaToCliOptions(base);
const { logLevel } = properties;

const getForce = function getForce(description) {
	return {
		alias: 'f',
		description,
		type: 'boolean',
	};
};

export const start = {
	properties: {
		...properties,
		force: getForce('Force restart even if the process is exists'),
		config: {
			alias: 'c',
			description: 'Path to the config file',
			default: '.potrc',
			type: 'string',
		},
		configWalk: {
			description: 'Walk to resolve config file',
			default: true,
			type: 'boolean',
		},
	},
};

export const stop = {
	properties: {
		force: getForce('Stop without confirming'),
		logLevel,
	},
};

export const list = {
	properties: {
		logLevel,
	},
};

export const dir = list;

export const log = {
	properties: {
		logLevel,
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
	},
};
