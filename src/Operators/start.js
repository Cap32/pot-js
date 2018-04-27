import exec from '../exec';
import logger from 'pot-logger';
import chalk from 'chalk';

export default async function start(options = {}) {
	const { daemon } = options;
	const proc = await exec(options);
	if (daemon) {
		const { name } = proc;
		console.log();
		logger.info(`"${name}" started with daemon mode`);
		logger.info(chalk.gray(`To get detail, run \`pot show ${name}\``));
		logger.info(chalk.gray(`To shut down, run \`pot stop ${name}\``));
		console.log();
	}
}
