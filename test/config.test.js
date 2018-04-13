import schema from '../src/schemas/config';
import validateBySchema from '../src/utils/validateBySchema';

describe('default config', () => {
	test('production config', async () => {
		const config = validateBySchema(schema, { production: true });
		expect(config).toMatchObject({
			production: true,
			cwd: expect.stringContaining('pot-js'),
			daemon: false,
			entry: './index.js',
			env: {},
			execArgs: [],
			execCommand: expect.stringContaining('node'),
			logLevel: 'INFO',
			logsDir: false,
			maxRestarts: -1,
			monitorProcessTitle: 'node',
			watch: false,
			workspace: 'defaults',
		});
	});

	test('development config', async () => {
		const config = validateBySchema(schema, { production: false });
		expect(config).toMatchObject({
			production: false,
			cwd: expect.stringContaining('pot-js'),
			daemon: false,
			entry: './index.js',
			env: {},
			execArgs: [],
			execCommand: expect.stringContaining('node'),
			logLevel: 'DEBUG',
			logsDir: false,
			maxRestarts: 0,
			monitorProcessTitle: 'node',
			watch: false,
			workspace: 'defaults',
		});
	});
});
