
export default {
	$schema: 'http://json-schema.org/draft-06/schema#',
	properties: {
		name: {
			type: 'string',
		},
		workspace: {
			type: 'string',
			default: 'defaults',
		},
		entry: {
			type: 'string',
			default: './index.js',
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
		cwd: {
			type: 'string',
			default: process.cwd(),
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
		enableLog: {
			type: 'boolean',
			default: true,
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
		daemon: {
			type: 'boolean',
			default: false,
		},
		production: {
			type: 'boolean',
			default: false,
		},
		env: {
			type: 'object',
			default: {},
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
		configToEnv: {
			type: 'string',
		},
	},
};
