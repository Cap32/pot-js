
import yargs from 'yargs';
import { name, version } from '../package.json';
import { upperCase } from 'lodash';
import { logger, setLoggers } from 'pot-logger';
import resolveConfig from './utils/resolveConfig';
import { start, stop, list, log, dir } from './';

// eslint-disable-next-line
yargs
	.usage('$0 <command> [args]')
	.demand(1, 'Please specify one of the commands!')
	.command({
		command: 'start [entry]',
		desc: 'Start process',
		builder(yargs) {
			yargs // eslint-disable-line
				.default('entry', './index.js')
				.options({
					baseDir: {
						desc: 'The base directory for resolving modules or directories. Defaults to the current working directory',
						type: 'string',
					},
					name: {
						desc: 'Server name',
						type: 'string',
					},
					daemon: {
						alias: 'd',
						desc: 'Use as a daemon',
						default: false,
						type: 'bool',
					},
					production: {
						alias: 'p',
						desc: 'Short hand for set NODE_ENV="production" env',
						default: false,
						type: 'bool',
					},
					logLevel: {
						alias: 'l',
						desc: 'Log level',
						choices: [
							'ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF',
						],
					},
					watch: {
						alias: 'w',
						desc: 'Enable watch mode',
						type: 'bool',
					},
					force: {
						alias: 'f',
						desc: 'Force restart even if the process is exists',
						type: 'bool',
					},
					config: {
						alias: 'c',
						desc: 'Path to the config file',
						default: '.potrc',
						type: 'string',
					},
					configWalk: {
						desc: 'Walk to resolve config file',
						default: true,
						type: 'bool',
					},
					cwd: {
						desc: 'Root dir. Defaults to `process.cwd()`',
						type: 'string',
					},
					execCommand: {
						desc: 'Exec command',
						type: 'string',
					},
					execArgs: {
						desc: 'Exec args',
						type: 'array',
					},
					logsDir: {
						desc: 'Log files dir. Resolve from `cwd`',
						type: 'string',
					},
					maxRestarts: {
						desc: 'How many restarts are allowed within 60s. `-1` for infinite restarts. If `production` is `true`, default value is `-1`, otherwise is `0`',
						type: 'number',
					},
					inspect: {
						desc: 'Activate inspector. Require Node.js >= v6.3.0',
						type: 'string',
					},
				})
				.argv
			;
		},
		async handler(argv) {
			try {
				await start(await resolveConfig(argv));
			}
			catch (err) {
				setLoggers('logLevel', argv.logLevel);
				logger.error(err.message);
				logger.debug(err);
			}
		},
	})
	.command({
		command: 'stop [name]',
		desc: 'Stop process',
		builder(yargs) {
			yargs // eslint-disable-line
				.options({
					f: {
						alias: 'force',
						desc: 'Stop without confirming',
						type: 'bool',
					},
					l: {
						alias: 'logLevel',
						desc: 'Log level',
						choices: [
							'ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF',
						],
						default: 'INFO',
					},
				})
				.argv
			;
		},
		handler(argv) {
			stop(argv).catch((err) => logger.error(err.message));
		},
	})
	.command({
		command: 'list',
		aliases: ['ls'],
		desc: 'List processes',
		handler(argv) {
			list(argv).catch((err) => logger.error(err.message));
		},
	})
	.command({
		command: 'log [name]',
		desc: 'Show log',
		builder(yargs) {
			yargs // eslint-disable-line
				.options({
					c: {
						alias: 'category',
						desc: 'Log category',
						type: 'string',
					},
					f: {
						alias: 'follow',
						desc: 'Follow mode. Just like `tail -f`',
						type: 'bool',
					},
					n: {
						alias: 'line',
						desc: 'Max lines.',
						type: 'number',
						default: 200,
					},
				})
				.argv
			;
		},
		handler(argv) {
			log(argv).catch((err) => logger.error(err.message));
		},
	})
	.command({
		command: 'dir [name]',
		desc: 'Show dir',
		handler(argv) {
			dir(argv).catch((err) => logger.error(err.message));
		},
	})
	.env(upperCase(name))
	.alias('h', 'help')
	.wrap(yargs.terminalWidth())
	.help()
	.version(version)
	.argv
;
