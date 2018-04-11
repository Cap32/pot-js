import createScriptRunner from '../createScriptRunner';
import which from 'which';

describe(__filename, () => {
	test('should run script work', (done) => {
		const run = createScriptRunner();
		const child = run('echo hello world');
		child.stdout.on('data', (data) => {
			expect(data.toString().trim()).toBe('hello world');
			done();
		});
	});

	test('should arguments work', (done) => {
		const run = createScriptRunner();
		const child = run('echo hello $1', 'world');
		child.stdout.on('data', (data) => {
			expect(data.toString().trim()).toBe('hello world');
			done();
		});
	});

	test('should not return child process if command is undefined', () => {
		const run = createScriptRunner();
		const child = run();
		expect(child).toBe(undefined);
	});

	test('should PATH work', (done) => {
		const run = createScriptRunner();
		const child = run('which which');
		child.stdout.on('data', (data) => {
			expect(data.toString().trim()).toBe(which.sync('which'));
			done();
		});
	});
});
