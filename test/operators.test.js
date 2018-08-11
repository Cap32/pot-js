import Pot from '../src';
import delay from 'delay';

describe('operators', () => {
	let pot;
	const { exec } = Pot;

	afterEach(async () => {
		if (pot) {
			await pot.requestShutDown();
			pot = null;
			await delay(1000);
		}
	});

	describe('operator.start', () => {
		test('should operator.start work', async () => {
			pot = await exec({ entry: 'test/fixtures/timeout.js' });
			const state = await pot.getState();
			expect(state.monitor.status).toBe('running');
		});

		test('should operator.start with daemon work', async () => {
			pot = await exec({ entry: 'test/fixtures/timeout.js', daemon: true });
			const state = await pot.getState();
			expect(state.monitor.status).toBe('running');
			expect(state.daemon).toBe(true);
		});
	});
});
