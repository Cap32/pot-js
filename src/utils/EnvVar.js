let cache;

export const ENV_VAR_KEY = 'POT_ENV_VAR';

export function getEnvVar() {
	if (cache) return cache;
	const str = process.env[ENV_VAR_KEY];
	return (cache = str ? JSON.parse(str) : null);
}
