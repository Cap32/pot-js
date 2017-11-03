
import { resolve } from 'path';
import { writeFile, remove } from 'fs-extra';
import { execSync } from 'child_process';
import { Bridge } from '../src';
import Kapok from 'kapok-js';
import delay from 'delay';
import { Client } from 'promise-ws';

const command = resolve('bin/pot');

Kapok.config.shouldKillOnDone = true;

afterEach(async () => {
	await Kapok.killAll();
});

describe('cli `pot start`', () => {
	test('should work', async () => {
		return Kapok
			.start(command, ['start', '--entry', 'test/fixtures/server.js'])
			.assertUntil(/started/)
			.assertUntil('test server started')
			.done()
		;
	});

	test('should throw error if `--entry` is not exists.', async () => {
		return Kapok
			.start(command, ['start'])
			.assertUntil(/^ERROR Cannot find module/)
			.done()
		;
	});

	test('should `--name` work', async () => {
		const name = 'hello';
		return Kapok
			.start(command, [
				'start', '--entry', 'test/fixtures/server.js', '--name', name,
			])
			.assertUntil(new RegExp(`"${name}" started`, 'i'))
			.done()
		;
	});

	test('should auto restart after killed', async () => {
		return Kapok
			.start(command, [
				'start',
				'--entry=test/fixtures/server.js',
				'--maxRestarts=1',
			])
			.assertUntil(/started/)
			.assertUntil('test server started', {
				action: async () => {
					const bridges = await Bridge.getList();
					const { pid } = await bridges[0].getInfo();
					execSync(`kill -9 ${pid}`); // kill client process
				},
			})
			.assertUntil(/sleeped/)
			.assertUntil('test server started') // restarted
			.done()
		;
	});
});

describe('cli `pot start` with daemon mode', async () => {
	const name = 'daemon-testing';

	afterEach(async () => {
		try {
			await Kapok.start(command, ['stop', name, '-f']).done();
		}
		catch (err) {}
	});

	test('should `daemon` mode work', async () => {
		await Kapok
			.start(command, [
				'start',
				'--name', name,
				'--env.PORT', 3010,
				'--entry', 'test/fixtures/socket.js',
				'--daemon',
			])
			.done()
		;

		await delay(2000);
		await Client.connect('ws://127.0.0.1:3010', async (client) => {
			const text = await client.emit('test', 'test');
			expect(text).toBe('test');
		});
	});
});

describe('cli `pot start` with config file', async () => {
	afterEach(async () => {
		await remove(resolve(__dirname, '.potrc.json'));
		await remove(resolve(__dirname, '.potrc'));
	});

	async function writeConfig(filename, data) {
		const file = resolve(__dirname, filename);
		return writeFile(file, data, 'utf8');
	}

	test('should read `.potrc` config file', async () => {
		await writeConfig('.potrc', `module.exports = { entry: 'fixtures/server.js' }`);
		return Kapok
			.start(command, ['start'], { cwd: __dirname })
			.assertUntil('test server started')
			.done()
		;
	});

	test('should read `.potrc.json` config file', async () => {
		await writeConfig('.potrc.json', `{ "entry": "fixtures/server.js" }`);
		return Kapok
			.start(command, ['start'], { cwd: __dirname })
			.assertUntil('test server started')
			.done()
		;
	});
});

describe('cli `pot stop`', () => {
	test('should work', async () => {
		await Kapok
			.start(command, ['start', '--entry', 'test/fixtures/server.js'])
			.until('test server started', {
				async action() {
					return Kapok
						.start(command, ['stop', '-f'])
						.assert('INFO "pot-js" stopped')
						.done()
					;
				},
			})
			.done()
		;
	});

	test('should throw error when no process is running', async () => {
		return Kapok
			.start(command, ['stop'])
			.assert('ERROR No process is running')
			.done()
		;
	});
});

// FIXME: hard to test
describe.skip('cli `pot ls`', () => {
	test('should work`', async () => {
		jest.setTimeout(20000);
		const createClient = async (port, name) => {
			await Kapok
				.start(command, [
					'start',
					'--entry', 'test/fixtures/server.js',
				], {
					env: {
						...process.env,
						PORT: port,
					},
				}, name)
				.until('test server started')
				.done()
			;
		};

		await createClient(3001, 'app-1');
		await createClient(3002, 'app-2');

		await Kapok
			.start(command, ['ls'])
			.ignoreUntil(/┐\s*$/)
			.joinUntil(/Pid/)
			.assert((message) => {
				return ['Name', 'Status', 'Crashes', 'Memory', 'CPU', 'Started', 'Pid']
					.every((key) => message.includes(key))
				;
			})
			.assertUntil(/app-1/)
			.assertUntil(/app-2/)
			.done()
		;
	});
});

describe('cli `pot dir`', () => {
	test('should work', async () => {
		return Kapok
			.start(
				command,
				['start', '--entry', 'test/fixtures/server.js', '--name', 'app'],
				{ env: { ...process.env, PORT: 3001 } },
			)
			.until('test server started', {
				async assert() {
					return Kapok
						.start(command, ['dir'])
						.assertUntil(process.cwd())
						.done()
					;
				}
			})
			.done()
		;
	});
});
