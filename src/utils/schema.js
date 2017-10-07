
export default {
	$schema: 'http://json-schema.org/draft-06/schema#',
	properties: {
		configToEnv: {
			type: 'string',
		},
		cwd: {
			type: 'string',
			default: process.cwd(),
		},
		daemon: {
			type: 'boolean',
			default: false,
		},
		enableLog: {
			type: 'boolean',
			default: true,
		},
		entry: {
			type: 'string',
			default: './index.js',
		},
		env: {
			type: 'object',
			default: {},
		},
		execArgs: {
			anyOf: [
				{
					type: 'array',
					items: {
						type: 'string',
					},
				},
				{
					type: 'string',
				},
			],
			default: [],
		},
		execCommand: {
			type: 'string',
			default: process.execPath,
		},
		inspect: {
			anyOf: [
				{
					type: 'object',
					properties: {
						port: {
							exclusiveMinimum: 0,
						},
						host: {
							type: 'string',
						},
					},
				},
				{
					type: 'string',
				},
				{
					type: 'boolean',
				},
			],
			default: false,
		},
		logLevel: {
			enum: [
				'ALL',
				'FATAL',
				'ERROR',
				'WARN',
				'INFO',
				'DEBUG',
				'TRACE',
				'OFF',
			],
			default: 'INFO',
		},
		logsDir: {
			type: 'string',
			default: '.logs',
		},
		maxRestarts: {
			minimum: -1,
		},
		monitorProcessTitle: {
			type: 'string',
			default: 'node',
		},
		name: {
			type: 'string',
		},
		production: {
			type: 'boolean',
			default: false,
		},
		watch: {
			oneOf: [
				{
					type: 'object',
					properties: {
						enable: {
							type: 'boolean',
							default: true,
						},
						dirs: {
							type: 'array',
							items: {
								type: 'string',
							},
						},
						ignoreDotFiles: {
							type: 'boolean',
							default: true,
						},
						ignoreNodeModulesDir: {
							type: 'boolean',
							default: true,
						},
					},
				},
				{
					type: 'boolean',
				},
			],
			default: false,
		},
		workspace: {
			type: 'string',
			default: 'defaults',
		},
	},
};
