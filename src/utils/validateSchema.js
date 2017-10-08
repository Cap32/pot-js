
import Ajv from 'ajv';
import getSchema from './getSchema';

const ajv = new Ajv({
	useDefaults: true,
	allErrors: true,
	verbose: true,
});

export default function validateSchema(config) {
	const valid = ajv.validate(getSchema(config.production), config);
	if (!valid) {
		const error = new Error(ajv.errorsText(ajv.errors, {
			dataVar: 'config',
		}));
		error.errors = ajv.errors;
		throw error;
	}
}
