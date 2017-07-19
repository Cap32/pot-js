
import { stop, delay } from './utils';
import { start, Bridge } from '../src';
import fetch from 'node-fetch';

afterEach(stop);

const entry = 'test/fixtures/server.js';
const PORT = 3010;

describe('api module `start`', () => {
	test('should `entry` and `port` work', async () => {
		await start({ env: { PORT }, entry });
		await delay();
		const res = await fetch('http://127.0.0.1:3010');
		const text = await res.text();
		expect(text).toBe('掂');
	});

	test('should `crashes` work', async () => {
		await start({
			entry: 'test/fixtures/crash.js',
			maxRestarts: 1,
		});
		await delay(2000);
		const bridges = await Bridge.getList();
		const info = await bridges[0].getInfo();
		expect(info.crashes).toBe(2);
	});

	test('should `configToEnv` work', async () => {
		const hello = 'world';
		await start({ env: { PORT }, entry, hello, configToEnv: 'RESPONSE_DATA' });
		await delay();
		const res = await fetch('http://127.0.0.1:3010');
		const data = await res.json();
		expect(data.hello).toBe(hello);
	});
});

describe('api module `Bridge.getList()`', () => {
	test('should `getInfo` work', async () => {
		const name = 'hello';
		await start({ env: { PORT }, name, entry });
		await delay();
		const bridges = await Bridge.getList();
		const info = await bridges[0].getInfo();
		expect(typeof info.pid).toBe('number');
		expect(info.crashes).toBe(0);
		expect(info.status).toBe('running');
		expect(info.data.name).toBe(name);
		expect(info.data.entry).toBe(entry);
	});
});
