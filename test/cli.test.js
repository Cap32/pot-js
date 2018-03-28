import { resolve } from 'path';
import { writeFile, remove } from 'fs-extra';
import { execSync } from 'child_process';
import { Connection } from '../src';
import Kapok from 'kapok-js';
import delay from 'delay';
import { Client } from 'promise-ws';

const command = resolve('bin/pot');

beforeEach(async () => {
	jest.setTimeout(15000);
});

describe('cli `pot start`', () => {
	test('should work', async () => {
		return Kapok.start(command, [
			'start',
			'--entry',
			'test/fixtures/server.js',
			'--logLevel=DEBUG',
		])
			.assertUntil(/started/)
			.assertUntil('test server started')
			.doneAndKill();
	});

	test('should throw error if `--entry` is not exists.', async () => {
		return Kapok.start(command, ['start'])
			.assertUntil(/^ERROR Cannot find module/)
			.doneAndKill();
	});

	test('should `--name` work', async () => {
		const name = 'hello';
		return Kapok.start(command, [
			'start',
			'--entry',
			'test/fixtures/server.js',
			'--name',
			name,
		])
			.assertUntil(new RegExp(`"${name}" started`, 'i'))
			.doneAndKill();
	});

	test('should auto restart after killed', async () => {
		return Kapok.start(command, [
			'start',
			'--entry=test/fixtures/server.js',
			'--maxRestarts=1',
		])
			.assertUntil(/started/)
			.assertUntil('test server started', {
				action: async () => {
					const connections = await Connection.getList();
					const { pid } = await connections[0].getInfo();
					execSync(`kill -9 ${pid}`); // kill client process
				},
			})
			.assertUntil(/sleeped/)
			.assertUntil('test server started') // restarted
			.doneAndKill();
	});
});

describe('cli `pot start` with daemon mode', async () => {
	const name = 'daemon-testing';

	afterEach(async () => {
		try {
			execSync(`${command} stop ${name} -f`);
		}
		catch (err) {}
	});

	test('should `daemon` mode work', async () => {
		const port = 3010;
		execSync(
			`${command} start --name=${name} --env.PORT=${port}` +
				' --entry=test/fixtures/socket.js --daemon',
		);
		await delay(2000);
		await Client.connect(`ws://127.0.0.1:${port}`, async (client) => {
			const text = await client.request('test', 'test');
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
		await writeConfig(
			'.potrc',
			'module.exports = { entry: \'fixtures/server.js\' }',
		);
		return Kapok.start(command, ['start'], { cwd: __dirname })
			.assertUntil('test server started')
			.doneAndKill();
	});

	test('should read `.potrc.json` config file', async () => {
		await writeConfig('.potrc.json', '{ "entry": "fixtures/server.js" }');
		return Kapok.start(command, ['start'], { cwd: __dirname })
			.assertUntil('test server started')
			.doneAndKill();
	});
});

describe('cli `pot stop`', () => {
	test('should `pot stop` work', async () => {
		await Kapok.start(command, ['start', '--entry', 'test/fixtures/server.js'])
			.until('test server started', {
				async action() {
					return Kapok.start(command, ['stop', '-f'])
						.assert('INFO "pot-js" stopped')
						.done();
				},
			})
			.done();
	});

	test('should throw error when no process is running', async () => {
		return Kapok.start(command, ['stop'])
			.assert('ERROR No process is running')
			.doneAndKill();
	});
});

describe('cli `pot stopall`', () => {
	test('should `pot stopall` work', async () => {
		await Kapok.start(command, [
			'start',
			'--name',
			'a',
			'--env.PORT',
			3010,
			'--entry',
			'test/fixtures/socket.js',
		])
			.until('socket server started', {
				async action() {
					return Kapok.start(command, [
						'start',
						'--name',
						'b',
						'--env.PORT',
						3011,
						'--entry',
						'test/fixtures/socket.js',
					])
						.until('socket server started', {
							async action() {
								return Kapok.start(command, ['stopall', '-f'])
									.assert(/INFO "[ab]" stopped/)
									.assert(/INFO "[ab]" stopped/)
									.done();
							},
						})
						.done();
				},
			})
			.done();
	});
});

describe('cli `pot ls`', () => {
	const processes = [];

	afterEach(async () => {
		await Promise.all(processes.map(async (proc) => proc.kill()));
	});

	test('should work`', async () => {
		const createProc = async (port, name) => {
			return Kapok.start(
				command,
				['start', '--name', name, '--entry', 'test/fixtures/server.js'],
				{
					env: {
						...process.env,
						PORT: port,
					},
				},
			)
				.until(/started/)
				.done();
		};

		const proc1 = await createProc(3001, 'app-1');
		const proc2 = await createProc(3002, 'app-2');

		await Kapok.start(command, ['ls'])
			.until(/^┌/)
			.joinUntil(/┤/)
			.assert((message) => {
				return [
					'Name',
					'Status',
					'Crashes',
					'Memory',
					'CPU',
					'Started',
					'Pid',
				].every((key) => message.includes(key));
			})
			.assertUntil(/app-1/)
			.assertUntil(/app-2/)
			.doneAndKill();

		processes.push(proc1, proc2);
	});
});

describe('cli `pot dir`', () => {
	test('should work', async () => {
		return Kapok.start(
			command,
			['start', '--entry', 'test/fixtures/server.js', '--name', 'app'],
			{ env: { ...process.env, PORT: 3001 } },
		)
			.until('test server started', {
				async assert() {
					return Kapok.start(command, ['dir'])
						.assertUntil(process.cwd())
						.doneAndKill();
				},
			})
			.doneAndKill();
	});
});
