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
			execPath: expect.stringContaining('node'),
			logLevel: 'INFO',
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
			execPath: expect.stringContaining('node'),
			logLevel: 'DEBUG',
			maxRestarts: 0,
			monitorProcessTitle: 'node',
			watch: false,
			workspace: 'defaults',
		});
	});
});
