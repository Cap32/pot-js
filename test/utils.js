
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

		await Promise.all(kapoks.map(({ kapok, name }) => {
			return new Promise((resolve) => {
				execSync(`${command} stop ${name} -f`);
				kapok.exit(resolve);
			});
		}));

		execSync(`${command} stop -f`);
	}
	catch (err) {
		console.warn('stop failed', err);
	}

	kapoks.length = 0;
};

export async function writeConfig(filename, data) {
	const file = resolve(__dirname, filename);
	return writeFile(file, data, 'utf8');
}

export function delay(t = 1000) {
	return new Promise((resolve) => {
		setTimeout(resolve, t);
	});
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('uncaughtException', stop);
process.on('unhandledRejection', (r) => {
	console.warn('unhandledRejection');
	console.warn(r);
});
