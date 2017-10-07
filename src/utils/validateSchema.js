
import Ajv from 'ajv';
import schema from './schema';

const ajv = new Ajv({
	useDefaults: true,
	allErrors: true,
	verbose: true,
});

export default function validateSchema(config) {
	const valid = ajv.validate(schema, config);
	if (!valid) {
		const error = new Error(ajv.errorsText(ajv.errors, {
			dataVar: 'config',
		}));
		error.errors = ajv.errors;
		throw error;
	}
}
