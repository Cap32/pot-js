import Pot from '../src';
import delay from 'delay';

describe('operators', () => {
	const pots = new Set();
	const { Operators } = Pot;

	afterEach(async () => {
		for (const pot of pots) {
			pot.requestShutDown();
		}
		pots.clear();
		await delay(1000);
	});

	describe('operator.start', () => {
		test('should operator.start work', async () => {
			const pot = await Operators.start({
				entry: 'test/fixtures/timeout.js',
			});
			pots.add(pot);
			const state = await pot.getState();
			expect(state.monitor.status).toBe('running');
		});
	});

	describe('operator.stop', () => {
		test('should operator.stop work', async () => {
			const pot = await Operators.start({
				name: 'foo',
				entry: 'test/fixtures/timeout.js',
			});
			pots.add(pot);
			await Operators.stop({ name: 'foo', force: true });
			const exists = await Pot.getByName('foo');
			expect(exists).toBeNull();
		});

		test('should operator.stopAll work', async () => {
			const names = ['foo', 'bar'];
			const newPots = await Promise.all(
				names.map((name) =>
					Operators.start({
						name,
						entry: 'test/fixtures/timeout.js',
					}),
				),
			);
			newPots.forEach((pot) => pots.add(pot));
			await Operators.stopAll({ force: true });
			const potNames = await Pot.getNames();
			expect(potNames.length).toBe(0);
		});
	});
});
