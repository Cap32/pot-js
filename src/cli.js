
import yargs from 'yargs';
import { name, version } from '../package.json';
import { upperCase } from 'lodash';
import logger from './utils/logger';
import resolveConfig from './utils/resolveConfig';
import { start, stop, list, log } from './';

// eslint-disable-next-line
yargs
	.usage('$0 <command> [args]')
	.demand(1, 'Please specify one of the commands!')
	.command({
		command: 'start [entry]',
		desc: 'Start process',
		builder(yargs) {
			yargs // eslint-disable-line
				.options({
					name: {
						desc: 'Server name',
						type: 'string',
					},
					d: {
						alias: 'daemon',
						desc: 'Use as a daemon',
						default: false,
						type: 'bool',
					},
					p: {
						alias: 'production',
						desc: 'Short hand for set NODE_ENV="production" env',
						type: 'bool',
					},
					l: {
						alias: 'log-level',
						desc: 'Log level',
						choices: [
							'ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF',
						],
						default: 'INFO',
					},
					w: {
						alias: 'watch',
						desc: 'Enable watch mode',
						default: false,
						type: 'bool',
					},
					'watch-dirs': {
						desc: 'Watch dirs',
						default: ['**/*'],
						type: 'array',
					},
					'watch-ignore-dot-files': {
						desc: 'Ignore watch dot files',
						default: true,
						type: 'bool',
					},
					f: {
						alias: 'force',
						desc: 'Force restart even if the process is exists',
						type: 'bool',
					},
					c: {
						alias: 'config',
						desc: 'Path to the config file',
						default: '.potrc',
						type: 'string',
					},
					'config-walk': {
						desc: 'Walk to resolve config file',
						default: true,
						type: 'bool',
					},
					root: {
						desc: 'Root dir. Defaults to `process.cwd()`',
						type: 'string',
					},
					'exec-command': {
						desc: 'Exec command',
						default: process.execPath,
						type: 'string',
					},
					'logs-dir': {
						desc: 'Log files dir. Resolve from `root`',
						default: '.logs',
						type: 'string',
					},
				})
				.argv
			;
		},
		async handler(argv) {
			const { watch, watchDirs, watchIgnoreDotFiles, ...options } = argv;

			options.watch = {
				enable: watch,
				dirs: watchDirs,
				ignoreDotFiles: watchIgnoreDotFiles,
			};

			try { start(await resolveConfig(options)); }
			catch (err) { logger.error(err.message); }
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
						desc: 'Follow mode. Just like `trail -f`',
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
	.env(upperCase(name))
	.alias('h', 'help')
	.wrap(yargs.terminalWidth())
	.help()
	.version(version)
	.argv
;
