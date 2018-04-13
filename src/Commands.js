import { logger, setLoggers } from 'pot-logger';
import resolveConfig from './utils/resolveConfig';
import * as Schemas from './schemas/cli';
import * as Handlers from './';

export const start = {
	command: 'start [entry]',
	description: 'Spawn and monitor a process',
	builder: (yargs) => {
		const { entry, ...options } = Schemas.start.properties;
		return yargs
			.usage('$0 start [entry] [options]')
			.positional('entry', entry)
			.options(options).argv;
	},
	async handler(argv) {
		try {
			const config = await resolveConfig(argv);
			await Handlers.start(config);
		}
		catch (err) {
			setLoggers('logLevel', argv.logLevel);
			logger.error(err.message);
			logger.debug(err);
		}
	},
};

export const stop = {
	command: 'stop [name]',
	description: 'Stop a process',
	builder: (yargs) => yargs.options(Schemas.stop.properties).argv,
	handler(argv) {
		Handlers.stop(argv).catch((err) => logger.error(err.message));
	},
};

export const stopall = {
	command: 'stopall',
	description: 'Stop all processes',
	builder: (yargs) => yargs.options(Schemas.stop.properties).argv,
	handler(argv) {
		Handlers.stopAll(argv).catch((err) => logger.error(err.message));
	},
};

export const list = {
	command: 'list',
	aliases: ['ls'],
	description: 'List processes',
	builder: (yargs) => yargs.options(Schemas.list.properties).argv,
	handler(argv) {
		Handlers.list(argv).catch((err) => logger.error(err.message));
	},
};

export const log = {
	command: 'log [name]',
	description: 'Show log',
	builder: (yargs) => yargs.options(Schemas.log.properties).argv,
	handler(argv) {
		Handlers.log(argv).catch((err) => logger.error(err.message));
	},
};

export const dir = {
	command: 'dir [name]',
	description: 'Show dir',
	builder: (yargs) => yargs.options(Schemas.dir.properties).argv,
	handler(argv) {
		Handlers.dir(argv).catch((err) => logger.error(err.message));
	},
};
