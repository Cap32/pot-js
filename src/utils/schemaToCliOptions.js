import { reduce } from 'lodash';

export default function schemaToCliOptions(schema) {
	return reduce(
		schema.properties,
		(acc, spec, key) => {
			const prop = (acc[key] = { ...spec });

			if (spec.anyOf) {
				Object.assign(prop, spec.anyOf[0]);
			}

			if (spec.enum) {
				prop.choices = spec.enum;
			}
			return acc;
		},
		{},
	);
}
