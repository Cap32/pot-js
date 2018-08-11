import delay from 'delay';
import Pot from '../src';
import { Client } from 'promise-ws';

const entry = 'test/fixtures/socket.js';
const PORT = 3010;
const logLevel = 'ERROR';

let pot;

beforeEach(async () => {
	jest.setTimeout(10000);
});

afterEach(async () => {
	if (pot) {
		await pot.requestShutDown();
		await delay(1000);
	}
});

describe('api module `exec`', () => {
	test('should `entry` and `port` work', async () => {
		pot = await Pot.exec({ env: { PORT }, entry, logLevel });
		await delay(1000);
		const client = await Client.create('ws://127.0.0.1:3010');
		const text = await client.request('test', '掂');
		expect(text).toBe('掂');
	});

	test('should `crashes` work', async () => {
		pot = await Pot.exec({
			entry: 'test/fixtures/crash.js',
			maxRestarts: 1,
			logLevel,
		});
		await delay(2000);
		const pots = await Pot.getList();
		const state = await pots[0].getState();
		expect(state.monitor.crashes).toBe(2);
	});

	test('should `ENV_VAR_KEY` work', async () => {
		const hello = 'world';
		pot = await Pot.exec({
			env: { PORT },
			entry,
			hello,
			logLevel,
		});
		await delay(1000);
		const client = await Client.create('ws://127.0.0.1:3010');
		const envString = await client.request('env');
		expect(JSON.parse(envString)).toMatchObject({
			hello,
			entry,
		});
	});
});

describe('api module `Pot.getList()`', () => {
	test('should `getState` work', async () => {
		const name = 'hello';
		pot = await Pot.exec({ name, entry, logLevel });
		await delay(1000);
		const pots = await Pot.getList();
		const state = await pots[0].getState();
		expect(typeof state.pid).toBe('number');
		expect(state.monitor.crashes).toBe(0);
		expect(state.monitor.status).toBe('running');
		expect(state.name).toBe(name);
		expect(state.entry).toBe(entry);
	});

	test('should `setState` work', async () => {
		const name = 'hello';
		pot = await Pot.exec({ name, entry, logLevel });
		await delay(1000);
		{
			const pots = await Pot.getList();
			const state = await pots[0].getState();
			expect(state.name).toBe(name);
			expect(state.hello).toBe(undefined);
		}

		{
			const pots = await Pot.getList();
			const state = await pots[0].setState({ hello: 'world' });
			expect(state.hello).toBe('world');
		}
	});
});
