import Pot from '../src';
import validateBySchema from '../src/utils/validateBySchema';

describe('default config', () => {
	test('production config', async () => {
		const options = { production: true };
		const schema = Pot.Schemas.getConfig(options);
		const config = validateBySchema(schema, options);
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
		const options = { production: false };
		const schema = Pot.Schemas.getConfig(options);
		const config = validateBySchema(schema, options);
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
