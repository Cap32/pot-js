
import { resolve } from 'path';
import { execSync } from 'child_process';
import Kapok from 'kapok-js';
import { writeFile, removeSync } from 'fs-extra';

const kapoks = [];

export const command = resolve('bin/pot');

export const start = (args, options, name = 'pot-js') => {
	const kapok = new Kapok(
		command,
		[...args, '--name', name],
		options,
	);
	kapoks.push({ name, kapok });
	return kapok;
};

export const stop = async () => {
	try {
		removeSync(resolve(__dirname, '.potrc.json'));
		removeSync(resolve(__dirname, '.potrc'));

		const promises = [];

		while (kapoks.length) {
			const { kapok, name } = kapoks.shift();
			promises.push(new Promise((resolve) => {
				execSync(`${command} stop ${name} -f`);
				kapok.exit(resolve);
			}));
		}

		return Promise.all(promises);
	}
	catch (err) {}
};

export async function writeConfig(filename, data) {
	const file = resolve(__dirname, filename);
	return writeFile(file, data, 'utf8');
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('uncaughtException', stop);
