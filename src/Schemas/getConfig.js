import EventTypes from '../constants/EventTypes';
import { DEFAULT_WORKSPACE } from '../constants/workspace';
import { reduce } from 'lodash';

export default function getConfigSchema(options = {}) {
	const { production = true } = options;
	return {
		$schema: 'http://json-schema.org/draft-07/schema#',
		properties: {
			args: {
				description: 'List of string arguments',
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
			baseDir: {
				description: 'The base directory for resolving modules or directories',
				type: 'string',
				default: '.',
			},
			cluster: {
				description:
					'Enforce using cluster mode. If not set, it will automatically set to `true` when spawning a Node.js related process',
				type: 'boolean',
			},
			config: {
				alias: 'c',
				description: 'Path to the config file',
				default: '.potrc',
				anyOf: [{ type: 'string' }, { type: 'boolean' }],
			},
			cwd: {
				description: 'Current working directory',
				type: 'string',
				default: process.cwd(),
			},
			daemon: {
				alias: 'd',
				description: 'Run as a daemon',
				type: 'boolean',
				default: false,
			},
			entry: {
				description: 'Entry script path',
				type: 'string',
				default: './index.js',
			},
			env: {
				description: 'Environment variables object',
				type: 'object',
				default: {},
			},
			events: {
				description:
					'Defining scripts by event hooks. Like `scripts` in `package.json`',
				type: 'object',
				properties: reduce(
					EventTypes,
					(acc, key) => {
						acc[key] = { type: 'string' };
						return acc;
					},
					{},
				),
				default: {},
			},
			execArgs: {
				description: 'Execution arguments',
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
			execPath: {
				description: 'Execution path',
				type: 'string',
				default: process.execPath,
			},
			force: {
				alias: 'f',
				description: 'Enforce restart even if the process is exists',
				type: 'boolean',
			},
			inspect: {
				description: 'Enable inspector. Require Node.js >= v6.3.0',
				anyOf: [
					{
						type: 'string',
					},
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
						type: 'boolean',
					},
				],
				default: false,
			},
			instances: {
				alias: 'i',
				description: 'Cluster instances',
				default: 1,
				type: 'number',
				maximum: 50,
			},
			logLevel: {
				alias: 'l',
				description: 'Log level',
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
				description: 'Log files directory',
				anyOf: [
					{
						type: 'boolean',
					},
					{
						type: 'string',
					},
				],
			},
			maxRestarts: {
				description: 'How many restarts are allowed within 60s',
				type: 'number',
				minimum: -1,
				default: production ? -1 : 0,
			},
			monitorProcessTitle: {
				description: 'Monitor process title',
				type: 'string',
				default: 'node',
			},
			name: {
				type: 'string',
				description: 'Process name. Shoule be unique',
			},
			production: {
				alias: 'p',
				description:
					'Production mode. Short hand for setting NODE_ENV="production" env',
				type: 'boolean',
				default: true,
			},
			watch: {
				alias: 'w',
				description: 'Enable watch mode',
				anyOf: [
					{
						type: 'boolean',
					},
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
				],
				default: false,
			},
			workspace: {
				description: 'Workspace',
				type: 'string',
				default: DEFAULT_WORKSPACE,
			},
		},
	};
}
