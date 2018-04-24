import os from 'os';

let cpus;

export default function ensureInstanceNumber(n) {
	n = ~~n;
	if (n > 0) return n;

	cpus = cpus || os.cpus().length;
	return !n ? cpus : ensureInstanceNumber(cpus - n);
}
