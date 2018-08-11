import Pot from '../src';
import delay from 'delay';

describe(__filename, () => {
	let pot;
	const { exec } = Pot;

	afterEach(async () => {
		if (pot) {
			await pot.requestShutDown();
			await delay(1000);
		}
	});

	test('should return a Pot instance', async () => {
		pot = await exec({ entry: 'test/fixtures/timeout.js' });
		expect(pot).toBeInstanceOf(Pot);
	});
});
