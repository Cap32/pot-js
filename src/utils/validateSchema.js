import Ajv from 'ajv';
import configSchema from '../schemas/config';

const ajv = new Ajv({
	useDefaults: true,
	allErrors: true,
	verbose: true,
	coerceTypes: true,
});

export default function validateSchema(config = {}) {
	const valid = ajv.validate(configSchema, config);
	if (!valid) {
		const error = new Error(
			ajv.errorsText(ajv.errors, {
				dataVar: 'config',
			}),
		);
		error.errors = ajv.errors;
		throw error;
	}
	if (config.inspect === 'false') config.inspect = false;
	return config;
}
