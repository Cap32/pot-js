import validateSchema from '../src/utils/validateSchema';

describe('default config', () => {
	test('production config', async () => {
		const config = validateSchema({ production: true });
		expect(config).toMatchObject({
			production: true,
			cwd: expect.stringContaining('pot-js'),
			daemon: false,
			entry: './index.js',
			env: {},
			execArgs: [],
			execCommand: expect.stringMatching(/node/),
			inspect: false,
			logLevel: 'INFO',
			logsDir: false,
			maxRestarts: -1,
			monitorProcessTitle: 'node',
			watch: false,
			workspace: 'defaults',
		});
	});

	test('development config', async () => {
		const config = validateSchema({ production: false });
		expect(config).toMatchObject({
			production: false,
			cwd: expect.stringContaining('pot-js'),
			daemon: false,
			entry: './index.js',
			env: {},
			execArgs: [],
			execCommand: expect.stringMatching(/node/),
			inspect: false,
			logLevel: 'DEBUG',
			logsDir: false,
			maxRestarts: 0,
			monitorProcessTitle: 'node',
			watch: false,
			workspace: 'defaults',
		});
	});
});
