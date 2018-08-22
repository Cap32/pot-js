import Ajv from 'ajv';
import { isFunction } from 'lodash';

const ajv = new Ajv({
	useDefaults: true,
	allErrors: true,
	verbose: true,
	coerceTypes: true,
});

export default function validateBySchema(schema, config = {}) {
	schema = isFunction(schema) ? schema(config) : schema;
	const valid = ajv.validate(schema, config);
	if (!valid) {
		const error = new Error(
			ajv.errorsText(ajv.errors, {
				dataVar: 'config',
			}),
		);
		error.errors = ajv.errors;
		throw error;
	}
	return config;
}
