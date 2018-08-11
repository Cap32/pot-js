import Pot from '../src';
import delay from 'delay';
import spawn from 'cross-spawn';
import { resolve } from 'path';

describe('daemon', () => {
	let pot;
	const bin = resolve('bin/pot');

	afterEach(async () => {
		if (pot) {
			await pot.requestShutDown();
			await delay(1000);
		}
	});

	test('should daemon work', async () => {
		const entry = 'test/fixtures/timeout.js';
		const name = 'foo';
		const command = `${bin} start ${entry} --name=${name} --daemon`;
		spawn.sync(command, [], { shell: true });
		pot = await Pot.getByName(name);
		const state = await pot.getState();
		expect(state.daemon).toBe(true);
	});
});
