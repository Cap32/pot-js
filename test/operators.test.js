import Pot from '../src';
import delay from 'delay';

describe('operators', () => {
	const pots = new Set();
	const { Operators } = Pot;

	afterEach(async () => {
		for (const pot of pots) {
			await pot.requestShutDown();
		}
		pots.clear();
		await delay(1000);
	});

	describe('operator.start', () => {
		test('should operator.start work', async () => {
			await Operators.start({
				name: 'foo',
				entry: 'test/fixtures/timeout.js',
				logLevel: 'ERROR',
			});
			const pot = await Pot.getByName('foo');
			pots.add(pot);
			const state = await pot.getState();
			expect(state.monitor.status).toBe('running');
		});
	});

	describe('operator.scale', () => {
		test('should operator.scale work', async () => {
			jest.setTimeout(20000);
			const pot = await Pot.exec({
				entry: 'test/fixtures/timeout.js',
				logLevel: 'ERROR',
			});
			pots.add(pot);
			const size = await pot.size();
			expect(size).toBe(1);
			await Operators.scale({ instances: 2, logLevel: 'ERROR' });
			const newSize = await pot.size();
			expect(newSize).toBe(2);
		});
	});

	describe('operator.stop', () => {
		test('should operator.stop work', async () => {
			const pot = await Pot.exec({
				name: 'foo',
				entry: 'test/fixtures/timeout.js',
				logLevel: 'ERROR',
			});
			pots.add(pot);
			await Operators.stop({ name: 'foo', force: true, logLevel: 'ERROR' });
			const exists = await Pot.getByName('foo');
			expect(exists).toBeNull();
		});

		test('should operator.stopAll work', async () => {
			jest.setTimeout(20000);
			const names = ['foo', 'bar'];
			const newPots = await Promise.all(
				names.map((name) =>
					Pot.exec({
						name,
						entry: 'test/fixtures/timeout.js',
						logLevel: 'ERROR',
					}),
				),
			);
			newPots.forEach((pot) => pots.add(pot));
			await Operators.stopAll({ force: true, logLevel: 'ERROR' });
			const potNames = await Pot.getNames();
			expect(potNames.length).toBe(0);
		});
	});

	describe('operator.restart', () => {
		test('should operator.restart work', async () => {
			const pot = await Pot.exec({
				name: 'foo',
				entry: 'test/fixtures/timeout.js',
				logLevel: 'ERROR',
			});
			pots.add(pot);
			const state0 = await pot.getState();
			const t0 = state0.monitor.started;
			await Operators.restart({ name: 'foo', logLevel: 'ERROR' });
			const state1 = await pot.getState();
			const t1 = state1.monitor.started;
			expect(t1 > t0).toBe(true);
		});

		test('should operator.restartAll work', async () => {
			jest.setTimeout(20000);
			const names = ['foo', 'bar'];
			const newPots = await Promise.all(
				names.map((name) =>
					Pot.exec({
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
			await Operators.restartAll({ logLevel: 'ERROR' });
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
			const pot = await Pot.exec({
				name: 'foo',
				entry: 'test/fixtures/timeout.js',
				logLevel: 'ERROR',
				instances: 2,
			});
			pots.add(pot);
			const state0 = await pot.getState();
			const t0 = state0.monitor.started;
			await Operators.reload({ name: 'foo', logLevel: 'ERROR' });
			const state1 = await pot.getState();
			const t1 = state1.monitor.started;
			expect(t1 > t0).toBe(true);
		});

		test('should operator.stopAll work', async () => {
			const names = ['foo', 'bar'];
			const newPots = await Promise.all(
				names.map((name) =>
					Pot.exec({
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
			await Operators.reloadAll({ logLevel: 'ERROR' });
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
