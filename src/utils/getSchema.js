
export default function getSchema(production) {
	return {
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
				default: production ? 'INFO' : 'DEBUG',
			},
			logsDir: {
				oneOf: [
					{
						type: 'boolean',
					},
					{
						type: 'string',
					},
				],
				default: false,
			},
			maxRestarts: {
				minimum: -1,
				default: production ? -1 : 0,
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
				default: production,
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
								defaults: ['**/*'],
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
};
