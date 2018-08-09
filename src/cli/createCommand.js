/* A helper function to create yargs command */

import { logger, setLoggers } from 'pot-logger';
import resolveConfig from '../utils/resolveConfig';
import getCliOptionsBySchema from '../utils/getCliOptionsBySchema';
import validateBySchema from '../utils/validateBySchema';
import { isFunction, isObject, flatten, omit } from 'lodash';

const builder = function builder(yargs) {
	const { middlewares, optional, demanded, original } = this;
	const potStore = middlewares[0] || {};
	const { schema, getBuilder } = potStore;
	const spec = getCliOptionsBySchema(schema);

	if (isFunction(getBuilder)) {
		return getBuilder.call(this, yargs, spec);
	}
	else if (isObject(spec)) {
		const args = yargs.usage(`$0 ${original}`);
		const positions = flatten([
			...demanded.map(({ cmd }) => cmd),
			...optional.map(({ cmd }) => cmd),
		]);
		positions.forEach((key) => {
			if (spec[key]) args.positional(key, omit(spec[key], ['alias']));
		});
		args.options(omit(spec, positions));
		return args;
	}

	return yargs.argv;
};

const handler = async function handler(argv) {
	try {
		const potStore = this.middlewares[0] || {};
		const { operator, configFile: configFileKey, schema, validate } = potStore;

		if (isFunction(operator)) {
			if (configFileKey) {
				argv = await resolveConfig(argv, configFileKey, schema);
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
