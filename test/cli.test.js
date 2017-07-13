
import { start, stop, writeConfig, command } from './utils';
import { execSync } from 'child_process';
import { getBridges } from '../src';
import Kapok from 'kapok-js';

afterEach(stop);

describe('cli `pot start`', () => {
	test('should work', async () => {
		return start(['start', '--entry', 'test/fixtures/server.js'])
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

	test('should `--name` work', async () => {
		const name = 'hello';
		return start(['start', '--entry', 'test/fixtures/server.js'], {}, name)
			.assertUntil(new RegExp(`${name} started`, 'i'))
			.done()
		;
	});

	test('should auto restart after killed', async () => {
		return start([
			'start',
			'--entry=test/fixtures/server.js',
			'--max-restarts=1',
		])
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
		await writeConfig('.potrc', `module.exports = { entry: 'fixtures/server.js' }`);
		return start(['start'], { cwd: __dirname })
			.assertUntil('test server started')
			.done()
		;
	});

	test('should read `.potrc.json` config file', async () => {
		await writeConfig('.potrc.json', `{ "entry": "fixtures/server.js" }`);
		return start(['start'], { cwd: __dirname })
			.assertUntil('test server started')
			.done()
		;
	});
});

describe('cli `pot stop`', () => {
	test('should work', async () => {
		await start(['start', '--entry', 'test/fixtures/server.js'])
			.until('test server started')
			.done()
		;
		return new Kapok(command, ['stop', '-f'])
			.assert('INFO "pot-js" stopped.')
			.done()
		;
	});

	test('should throw error when no process is running', async () => {
		return new Kapok(command, ['stop'])
			.assert('ERROR No process is running.')
			.done()
		;
	});
});

describe('cli `pot ls`', () => {
	test('should work`', async () => {
		const createClient = async (port, name) => {
			const kapok = start([
				'start',
				'--entry', 'test/fixtures/server.js',
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
});

describe('cli `pot dir`', () => {
	test('should work', async () => {
		const createClient = async (port, name) => {
			const kapok = start([
				'start',
				'--entry', 'test/fixtures/server.js',
			], {
				env: {
					...process.env,
					PORT: port,
				},
			}, name);
			return kapok.until('test server started').done();
		};

		await createClient(3001, 'app');

		await new Kapok(command, ['dir'])
			.assertUntil(process.cwd())
			.done()
		;
	});
});
