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
		if (prop.defaultDescription === undefined) {
			prop.defaultDescription = getDefaultDescription(defaults);
		}
		if (prop.type && prop.type.startsWith('bool')) {
			prop.default = undefined;
		}
		else {
			delete prop.default;
		}
	}
};

const cache = new WeakMap();

export default function getCliOptionsBySchema(schema, blacklist = []) {
	const { properties } = schema || {};
	if (!properties) return;

	if (cache.has(schema)) return cache.get(schema);

	blacklist = blacklist.filter(Boolean);
	const res = reduce(
		properties,
		(acc, spec, key) => {
			const prop = (acc[key] = { ...spec });
			if (spec.enum) prop.choices = spec.enum;
			if (!blacklist.length || !~blacklist.indexOf(key)) {
				skip(prop);
			}
			return acc;
		},
		{},
	);

	cache.set(schema, res);
	return res;
}
