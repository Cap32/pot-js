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
				logLevel: 'ERROR',
			});
			pots.add(pot);
			const state = await pot.getState();
			expect(state.monitor.status).toBe('running');
		});
	});

	describe('operator.scale', () => {
		test('should operator.scale work', async () => {
			const pot = await Operators.start({
				entry: 'test/fixtures/timeout.js',
				logLevel: 'ERROR',
			});
			pot.disconnect();
			expect(pot.size()).toBe(1);
			await Operators.scale({ instances: 2 });
			const newPot = await Pot.getByName(pot.name);
			pots.add(newPot);
			expect(newPot.size()).toBe(2);
		});
	});

	describe('operator.stop', () => {
		test('should operator.stop work', async () => {
			const pot = await Operators.start({
				name: 'foo',
				entry: 'test/fixtures/timeout.js',
				logLevel: 'ERROR',
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
						logLevel: 'ERROR',
					}),
				),
			);
			newPots.forEach((pot) => pots.add(pot));
			await Operators.stopAll({ force: true });
			const potNames = await Pot.getNames();
			expect(potNames.length).toBe(0);
		});
	});

	describe('operator.restart', () => {
		test('should operator.restart work', async () => {
			const pot = await Operators.start({
				name: 'foo',
				entry: 'test/fixtures/timeout.js',
				logLevel: 'ERROR',
			});
			pots.add(pot);
			const state0 = await pot.getState();
			const t0 = state0.monitor.started;
			await Operators.restart({ name: 'foo' });
			const state1 = await pot.getState();
			const t1 = state1.monitor.started;
			expect(t1 > t0).toBe(true);
		});

		test('should operator.stopAll work', async () => {
			const names = ['foo', 'bar'];
			const newPots = await Promise.all(
				names.map((name) =>
					Operators.start({
						name,
						entry: 'test/fixtures/timeout.js',
						logLevel: 'ERROR',
					}),
				),
			);
			const ts0 = [];
			const ts1 = [];
			for (const newPot of newPots) {
				pots.add(newPot);
				const state = await newPot.getState();
				ts0.push(state.monitor.started);
			}
			await Operators.restartAll();
			for (const newPot of newPots) {
				const state = await newPot.getState();
				ts1.push(state.monitor.started);
			}
			names.forEach((_, index) => {
				expect(ts1[index] > ts0[index]).toBe(true);
			});
		});
	});

	describe('operator.reload', () => {
		jest.setTimeout(30000);

		test('should operator.reload work', async () => {
			const pot = await Operators.start({
				name: 'foo',
				entry: 'test/fixtures/timeout.js',
				logLevel: 'ERROR',
				instances: 2,
			});
			pots.add(pot);
			const state0 = await pot.getState();
			const t0 = state0.monitor.started;
			await Operators.reload({ name: 'foo' });
			const state1 = await pot.getState();
			const t1 = state1.monitor.started;
			expect(t1 > t0).toBe(true);
		});

		test('should operator.stopAll work', async () => {
			const names = ['foo', 'bar'];
			const newPots = await Promise.all(
				names.map((name) =>
					Operators.start({
						name,
						entry: 'test/fixtures/timeout.js',
						logLevel: 'ERROR',
						instances: 2,
					}),
				),
			);
			const ts0 = [];
			const ts1 = [];
			for (const newPot of newPots) {
				pots.add(newPot);
				const state = await newPot.getState();
				ts0.push(state.monitor.started);
			}
			await Operators.reloadAll();
			for (const newPot of newPots) {
				const state = await newPot.getState();
				ts1.push(state.monitor.started);
			}
			names.forEach((_, index) => {
				expect(ts1[index] > ts0[index]).toBe(true);
			});
		});
	});
});
