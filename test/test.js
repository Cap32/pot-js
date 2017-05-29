
import { start, stop } from './utils';
import { execSync } from 'child_process';
import { getBridges } from '../src';

afterEach(stop);

test('cli `pot start`', async () => {
	return start(['start', '--entry', 'test/server.js'])
		.assertUntil(/started/)
		.assertUntil('test server started')
		.done()
	;
});

test('should throw error if `--entry` is not exists.', async () => {
	return start(['start'])
		.assertUntil(/^ERROR Cannot find module/)
		.done()
	;
});

test('cli `pot start --name`', async () => {
	const name = 'hello';
	return start(['start', '--entry', 'test/server.js', '--name', name])
		.assertUntil(new RegExp(`${name} started`, 'i'))
		.done()
	;
});

test('getBridges() and getInfo()', async () => {
	const name = 'hello';
	const entry = 'test/server.js';
	return start(['start', '--entry', entry, '--name', name])
		.assertUntil(/started/)
		.assertUntil('test server started', {
			action: async () => {
				const bridges = await getBridges();
				const info = await bridges[0].getInfo();
				expect(typeof info.pid).toBe('number');
				expect(info.crashes).toBe(0);
				expect(info.status).toBe('running');
				expect(info.data.name).toBe(name);
				expect(info.data.entry).toBe(entry);
			},
		})
		.done()
	;
});

test('should auto restart after killed', async () => {
	return start(['start', '--entry', 'test/server.js'])
		.assertUntil(/started/)
		.assertUntil('test server started', {
			action: async () => {
				const bridges = await getBridges();
				const { pid } = await bridges[0].getInfo();
				execSync(`kill -9 ${pid}`); // kill client process
			},
		})
		.assertUntil(/sleeped/)
		.assertUntil('test server started') // restarted
		.done()
	;
});
