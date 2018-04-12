import { reduce, isObject } from 'lodash';

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

// skip validation and default assigment, because it will do it at `start()`
const skip = function skip(prop) {
	const defaults = prop.default;
	prop.skipValidation = true;
	if (defaults !== undefined) {
		prop.defaultDescription = getDefaultDescription(defaults);
		if (prop.type && prop.type.startsWith('bool')) {
			prop.default = undefined;
		}
		else {
			delete prop.default;
		}
	}
};

export default function schemaToCliOptions(schema) {
	return reduce(
		schema.properties,
		(acc, spec, key) => {
			const prop = (acc[key] = { ...spec });
			if (spec.anyOf) Object.assign(prop, spec.anyOf[0]);
			if (spec.enum) prop.choices = spec.enum;
			skip(prop);
			return acc;
		},
		{},
	);
}
