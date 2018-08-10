import os from 'os';
import ensureInstanceNumber from '../ensureInstanceNumber';

describe(__filename, () => {
	test('should instance number > 0 work', () => {
		expect(ensureInstanceNumber(100)).toBe(100);
	});

	test('should instance number === 0 work', () => {
		expect(ensureInstanceNumber(0)).toBe(os.cpus().length);
	});

	test('should instance number < 0 work', () => {
		expect(ensureInstanceNumber(-1)).toBe(os.cpus().length - 1);
	});
});
