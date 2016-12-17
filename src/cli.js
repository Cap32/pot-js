
import yargs from 'yargs';
import { name, version } from '../package.json';
import { upperCase } from 'lodash';
import logger from './utils/logger';
import { start, stop, list, log } from './';

// eslint-disable-next-line
yargs
	.usage('$0 <command> [args]')
	.demand(1, 'Please specify one of the commands!')
	.command({
		command: 'start <command>',
		desc: 'Start process',
		demand: 2,
		builder(yargs) {
			yargs // eslint-disable-line
				.options({
					name: {
						desc: 'Server name',
						type: 'string',
					},
					port: {
						desc: 'Server port',
						type: 'number',
					},
					execCommand: {
						desc: 'Exec command',
						default: process.execPath,
						type: 'string',
					},
					e: {
						alias: 'entry',
						desc: 'Entry directory',
						type: 'string',
					},
					d: {
						alias: 'daemon',
						desc: 'Use as a daemon',
						type: 'bool',
						default: false,
					},
					c: {
						alias: 'config',
						desc: 'Path to the config file.',
						type: 'string',
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
				})
				.argv
			;
		},
		handler(argv) {
			start(argv).catch((err) => logger.error(err.message));
		},
	})
	.command({
		command: 'stop [name]',
		desc: 'Stop process',
		demand: 2,
		handler(argv) {
			stop(argv).catch((err) => logger.error(err.message));
		},
	})
	.command({
		command: 'list',
		aliases: ['ls'],
		desc: 'List processes',
		builder(yargs) {
			yargs // eslint-disable-line
				.options({
					t: {
						alias: 'category',
						desc: 'Log category',
						default: 'out',
						type: 'string',
					},
					f: {
						alias: 'follow',
						desc: 'Follow mode. Just like `trail -f`.',
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
			list(argv).catch((err) => logger.error(err.message));
		},
	})
	.command({
		command: 'log [name]',
		desc: 'Show log',
		// demand: 2,
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
						desc: 'Follow mode. Just like `trail -f`.',
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
