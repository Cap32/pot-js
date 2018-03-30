import delay from 'delay';
import { start, Connection } from '../src';
import { Client } from 'promise-ws';

const entry = 'test/fixtures/socket.js';
const PORT = 3010;

let proc;

beforeEach(async () => {
	jest.setTimeout(10000);
});

afterEach(async () => {
	if (proc && typeof proc.kill === 'function') {
		await proc.kill();
		await delay(1000);
	}
});

describe('api module `start`', () => {
	test('should `entry` and `port` work', async () => {
		proc = await start({ env: { PORT }, entry });
		await delay(1000);
		const client = await Client.create('ws://127.0.0.1:3010');
		const text = await client.request('test', '掂');
		expect(text).toBe('掂');
	});

	test('should `crashes` work', async () => {
		proc = await start({
			entry: 'test/fixtures/crash.js',
			maxRestarts: 1,
		});
		await delay(2000);
		const connections = await Connection.getList();
		const info = await connections[0].getInfo();
		expect(info.crashes).toBe(2);
	});

	test('should `configToEnv` work', async () => {
		const hello = 'world';
		proc = await start({
			env: { PORT },
			entry,
			hello,
			configToEnv: 'POT_TESTING',
		});
		await delay(1000);
		const client = await Client.create('ws://127.0.0.1:3010');
		const envString = await client.request('env');
		expect(JSON.parse(envString)).toMatchObject({
			hello: 'world',
			entry,
			configToEnv: 'POT_TESTING',
		});
	});
});

describe('api module `Connection.getList()`', () => {
	test('should `getState` work', async () => {
		const name = 'hello';
		proc = await start({ name, entry });
		await delay(1000);
		const connections = await Connection.getList();
		const state = await connections[0].getState();
		expect(typeof state.pid).toBe('number');
		expect(state.crashes).toBe(0);
		expect(state.status).toBe('running');
		expect(state.data.name).toBe(name);
		expect(state.data.entry).toBe(entry);
	});

	test('should `setState` work', async () => {
		const name = 'hello';
		proc = await start({ name, entry });
		await delay(1000);
		{
			const connections = await Connection.getList();
			const state = await connections[0].getState();
			expect(state.data.name).toBe(name);
			expect(state.data.hello).toBe(undefined);
		}

		{
			const connections = await Connection.getList();
			const state = await connections[0].setState({ hello: 'world' });
			expect(state.data.hello).toBe('world');
		}
	});
});
