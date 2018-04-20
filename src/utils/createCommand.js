/* A helper function to create yargs command */

import { logger, setLoggers } from 'pot-logger';
import resolveConfig from './resolveConfig';
import getCliOptionsBySchema from './getCliOptionsBySchema';
import validateBySchema from './validateBySchema';
import { isFunction, isObject, forEach, flatten } from 'lodash';

// TODO: should fix demanded bug
const builder = function builder(yargs) {
	const { middlewares, optional, demanded, original } = this;
	const potStore = middlewares[0] || {};
	const { schema, getBuilder, configFile } = potStore;
	const spec = getCliOptionsBySchema(schema, [configFile]);

	if (schema && schema.properties && schema.properties[configFile]) {
		delete schema.properties[configFile];
	}

	if (isFunction(getBuilder)) {
		return getBuilder.call(this, yargs, spec);
	}
	else if (isObject(spec)) {
		const args = yargs.usage(`$0 ${original}`);
		const positions = flatten([
			...demanded.map(({ cmd }) => cmd),
			...optional.map(({ cmd }) => cmd),
		]);
		const options = {};
		forEach(spec, (val, key) => {
			if (~positions.indexOf(key)) {
				args.positional(key, val);
			}
			else {
				options[key] = val;
			}
		});
		args.options(options);

		const { argv } = args;
		positions.forEach((key, index) => {
			argv[key] = argv._[index + 1];
		});
		return argv;
	}

	return yargs.argv;
};

const handler = async function handler(argv) {
	try {
		const potStore = this.middlewares[0] || {};
		const { operator, configFile, schema, validate } = potStore;

		if (isFunction(operator)) {
			if (configFile) {
				argv = await resolveConfig(argv, configFile);
			}
			if (validate && schema) {
				validateBySchema(schema, argv);
			}
			await operator(argv);
		}
	}
	catch (err) {
		setLoggers('logLevel', argv.logLevel || 'INFO');
		logger.error(err.message);
		logger.debug(err);
	}
};

export default function createCommand(options = {}) {
	const {
		operator,
		schema,
		getBuilder,
		configFile,
		validate,
		middlewares = [],
		...other
	} = options;

	// A trick middleware to store configs
	const potStoreMiddleware = function potStoreMiddleware(a) {
		return a;
	};
	Object.assign(potStoreMiddleware, {
		operator,
		schema,
		getBuilder,
		configFile,
		validate,
	});
	middlewares.unshift(potStoreMiddleware);

	return {
		builder,
		handler,
		...other,
		middlewares,
	};
}
