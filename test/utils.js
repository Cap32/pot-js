
import { resolve } from 'path';
import { execSync } from 'child_process';
import Kapok from 'kapok-js';
import { writeFile, remove } from 'fs-extra';

let kapok;
const command = resolve('bin/pot');

export const start = (args, options) => {
	kapok = new Kapok(
		command,
		// ['--execCommand=babel-node', ...args],
		args,
		{
			// stdio: 'inherit',
			...options,
		},
	);
	return kapok;
};

export const stop = async (done) => {
	try {
		execSync(`${command} stop -f`);
		await remove(resolve(__dirname, '.potrc'));
		kapok.exit(done);
	}
	catch (err) {}
};

export async function writeConfig(data) {
	const filename = resolve(__dirname, '.potrc');
	return writeFile(filename, data, 'utf8');
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('uncaughtException', stop);
