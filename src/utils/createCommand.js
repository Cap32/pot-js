/* A helper function to create yargs command */

import { logger, setLoggers } from 'pot-logger';
import resolveConfig from './resolveConfig';
import getCliOptionsBySchema from './getCliOptionsBySchema';
import { isFunction, isObject } from 'lodash';

const builder = function builder(yargs) {
	const potStore = this.middlewares[0] || {};
	const options = getCliOptionsBySchema(potStore.schema);

	if (isFunction(potStore.getBuilder)) {
		return potStore.getBuilder.call(this, yargs, options);
	}
	else if (isObject(options)) {
		return yargs.usage(`$0 ${this.original}`).options(options).argv;
	}
	return yargs.argv;
};

const handler = async function handler(argv) {
	try {
		const { operator } = this.middlewares[0];
		if (isFunction(operator)) {
			const config = await resolveConfig(argv);
			await operator(config);
		}
	}
	catch (err) {
		setLoggers('logLevel', argv.logLevel || 'INFO');
		logger.error(err.message);
		logger.debug(err);
	}
};

export default function createCommand(options = {}) {
	const { operator, schema, getBuilder, middlewares = [], ...other } = options;

	// A trick middleware to store configs
	const potStoreMiddleware = function potStoreMiddleware(a) {
		return a;
	};
	Object.assign(potStoreMiddleware, { operator, schema, getBuilder });
	middlewares.unshift(potStoreMiddleware);

	return {
		builder,
		handler,
		...other,
		middlewares,
	};
}
