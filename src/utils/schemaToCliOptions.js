import { reduce, isObject } from 'lodash';

const noDefault = function noDefault(prop) {
	const getDefaultDescription = function getDefaultDescription(defaults) {
		if (Array.isArray(defaults)) {
			return `[${defaults.join()}]`;
		}
		else if (isObject(defaults)) {
			try {
				return JSON.stringify(defaults);
			}
			catch (err) {
				return defaults.toString();
			}
		}
		return defaults;
	};
	const defaults = prop.default;
	if (defaults !== undefined) {
		if (prop.type && prop.type.startsWith('bool')) {
			delete prop.type;
		}
		prop.defaultDescription = getDefaultDescription(defaults);
		delete prop.default;
	}
};

export default function schemaToCliOptions(schema) {
	return reduce(
		schema.properties,
		(acc, spec, key) => {
			const prop = (acc[key] = { ...spec });

			if (spec.anyOf) {
				Object.assign(prop, spec.anyOf[0]);
			}

			noDefault(prop);

			if (spec.enum) {
				prop.choices = spec.enum;
			}
			prop.skipValidation = true;
			return acc;
		},
		{},
	);
}
