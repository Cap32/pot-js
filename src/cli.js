
import yargs from 'yargs';
import { name, version } from '../package.json';
import { upperCase } from 'lodash';
import logger, { setLevel } from './utils/logger';
import resolveConfig, { Defaults } from './utils/resolveConfig';
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
				.default('entry', Defaults.ENTRY)
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
						default: false,
						type: 'bool',
					},
					l: {
						alias: 'log-level',
						desc: 'Log level',
						choices: [
							'ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF',
						],
						default: Defaults.LOG_LEVEL,
					},
					w: {
						alias: 'watch',
						desc: 'Enable watch mode',
						default: Defaults.WATCH,
						type: 'bool',
					},
					'watch-dirs': {
						desc: 'Watch dirs',
						default: Defaults.WATCH_DIRS,
						type: 'array',
					},
					'watch-ignore-dot-files': {
						desc: 'Ignore watch dot files',
						default: Defaults.WATCH_IGNORE_DOT_FILES,
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
						default: Defaults.EXEC_COMMAND,
						type: 'string',
					},
					'logs-dir': {
						desc: 'Log files dir. Resolve from `root`',
						default: Defaults.LOGS_DIR,
						type: 'string',
					},
					inject: {
						desc: 'Enable to inject config data to child process',
						type: 'bool',
					},
				})
				.argv
			;
		},
		async handler(argv) {
			const {
				watch, watchDirs, watchIgnoreDotFiles, ...options,
			} = argv;

			options.watch = {
				enable: watch,
				dirs: watchDirs,
				ignoreDotFiles: watchIgnoreDotFiles,
			};

			try {
				await start(await resolveConfig(options));
			}
			catch (err) {
				setLevel(options.logLevel);
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
