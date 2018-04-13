/* A helper function to create yargs command */

import { logger, setLoggers } from 'pot-logger';
import resolveConfig from './resolveConfig';
import getCliOptionsBySchema from './getCliOptionsBySchema';
import { isFunction, isObject, omit } from 'lodash';

const builder = function builder(yargs) {
	const potStore = this.middlewares[0] || {};
	const { schema, configFile, getBuilder, workspace } = potStore;
	let options = getCliOptionsBySchema(schema, ['config']);

	if (options) {
		if (configFile) {
			const { value: configValue, defaultValue } = configFile;
			if (configValue) {
				if (options.config) options.config.hidden = true;
			}
			else if (defaultValue !== undefined) {
				if (options.config) options.config.default = defaultValue;
			}
		}

		if (workspace) {
			options = omit(options, ['workspace']);
		}
	}

	if (isFunction(getBuilder)) {
		return getBuilder.call(this, yargs, options);
	}
	else if (isObject(options)) {
		return yargs.usage(`$0 ${this.original}`).options(options).argv;
	}

	return yargs.argv;
};

const handler = async function handler(argv) {
	try {
		const potStore = this.middlewares[0] || {};
		const { operator, configFile, workspace } = potStore;

		if (isFunction(operator)) {
			if (workspace) {
				argv.workspace = workspace;
			}

			if (configFile) {
				const { value: configValue } = configFile;
				if (configValue) {
					argv.config = configValue;
				}
				argv = await resolveConfig(argv, argv.config);
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
		workspace,
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
		workspace,
	});
	middlewares.unshift(potStoreMiddleware);

	return {
		builder,
		handler,
		...other,
		middlewares,
	};
}
