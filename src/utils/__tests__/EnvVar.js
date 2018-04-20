import { ENV_VAR_KEY, getEnvVar } from '../EnvVar';

describe(__filename, () => {
	const flush = () => delete process.env[ENV_VAR_KEY];

	beforeEach(flush);
	afterEach(flush);

	test('should ENV_VAR_KEY be string', () => {
		expect(typeof ENV_VAR_KEY).toBe('string');
	});

	test('should getEnvVar() return null if not set', () => {
		expect(getEnvVar()).toEqual(null);
	});

	test('should getEnvVar() return json object if set', () => {
		process.env[ENV_VAR_KEY] = JSON.stringify({ hello: 'world' });
		expect(getEnvVar()).toEqual({ hello: 'world' });
	});

	test('should cache getEnvVar() result', () => {
		process.env[ENV_VAR_KEY] = JSON.stringify({ hello: 'world' });
		expect(getEnvVar()).toEqual({ hello: 'world' });
		process.env[ENV_VAR_KEY] = JSON.stringify({ hello: 'chris' });
		expect(getEnvVar()).toEqual({ hello: 'world' });
	});
});
