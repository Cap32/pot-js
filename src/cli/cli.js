import yargs from 'yargs';
import { name, version } from '../../package.json';
import { upperCase } from 'lodash';
import { logger, setLoggers } from 'pot-logger';
import resolveConfig from '../utils/resolveConfig';
import * as Schemas from '../schemas/cli';
import { start, stop, stopAll, list, log, dir } from '../';

// eslint-disable-next-line
yargs
	.usage('$0 <command> [options]')
	.demand(1, 'Please specify one of the commands!')
	.command({
		command: 'start [entry]',
		description: 'Start process',
		builder: (yargs) => {
			const { entry, ...options } = Schemas.start.properties;
			return yargs
				.usage('$0 start [entry] [options]')
				.positional('entry', entry)
				.options(options).argv;
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
		description: 'Stop process',
		builder: (yargs) => yargs.options(Schemas.stop.properties).argv,
		handler(argv) {
			stop(argv).catch((err) => logger.error(err.message));
		},
	})
	.command({
		command: 'stopall',
		description: 'Stop all processes',
		builder: (yargs) => yargs.options(Schemas.stop.properties).argv,
		handler(argv) {
			stopAll(argv).catch((err) => logger.error(err.message));
		},
	})
	.command({
		command: 'list',
		aliases: ['ls'],
		description: 'List processes',
		builder: (yargs) => yargs.options(Schemas.list.properties).argv,
		handler(argv) {
			list(argv).catch((err) => logger.error(err.message));
		},
	})
	.command({
		command: 'log [name]',
		description: 'Show log',
		builder: (yargs) => yargs.options(Schemas.log.properties).argv,
		handler(argv) {
			log(argv).catch((err) => logger.error(err.message));
		},
	})
	.command({
		command: 'dir [name]',
		description: 'Show dir',
		builder: (yargs) => yargs.options(Schemas.dir.properties).argv,
		handler(argv) {
			dir(argv).catch((err) => logger.error(err.message));
		},
	})
	.env(upperCase(name))
	.alias('h', 'help')
	.wrap(yargs.terminalWidth())
	.help()
	.version(version).argv;
