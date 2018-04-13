import Ajv from 'ajv';

const ajv = new Ajv({
	useDefaults: true,
	allErrors: true,
	verbose: true,
	coerceTypes: true,
});

export default function validateBySchema(schema, config = {}) {
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
