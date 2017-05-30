
import { start, stop, writeConfig, command } from './utils';
import { execSync } from 'child_process';
import { getBridges } from '../src';
import Kapok from 'kapok-js';

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
	return start(['start', '--entry', 'test/server.js'], {}, name)
		.assertUntil(new RegExp(`${name} started`, 'i'))
		.done()
	;
});

test('getBridges() and getInfo()', async () => {
	const name = 'hello';
	const entry = 'test/server.js';
	return start(['start', '--entry', entry], {}, name)
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

test('should read `.potrc` config file', async () => {
	await writeConfig('.potrc', `module.exports = { entry: 'server.js' }`);
	return start(['start'], { cwd: __dirname })
		.assertUntil('test server started')
		.done()
	;
});

test('should read `.potrc.json` config file', async () => {
	await writeConfig('.potrc.json', `{ "entry": "server.js" }`);
	return start(['start'], { cwd: __dirname })
		.assertUntil('test server started')
		.done()
	;
});

test('cli `pot stop`', async () => {
	await start(['start', '--entry', 'test/server.js'])
		.until('test server started')
		.done()
	;
	return new Kapok(command, ['stop', '-f'])
		.assert('INFO "pot-js" stopped.')
		.done()
	;
});

test('cli `pot stop` without running any processes', async () => {
	return new Kapok(command, ['stop'])
		.assert('ERROR No process is running.')
		.done()
	;
});

test('cli `pot ls`', async () => {
	const createClient = async (port, name) => {
		const kapok = start([
			'start',
			'--entry', 'test/server.js',
		], {
			env: {
				...process.env,
				PORT: port,
			},
		}, name);
		return kapok.until('test server started').done();
	};

	await createClient(3001, 'app-1');
	await createClient(3002, 'app-2');

	await new Kapok(command, ['ls'])
		.assertUntil(/┌/)
		.assert((message) => {
			return ['Name', 'Status', 'Crashes', 'Memory', 'Started', 'Pid']
				.every((key) => message.contains(key))
			;
		})
		.ignoreUntil(/├/)
		.assert(/app-1/)
		.ignoreUntil(/├/)
		.assert(/app-2/)
		.done()
	;

}, 10000);
