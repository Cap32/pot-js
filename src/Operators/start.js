import exec from '../exec';
import logger from 'pot-logger';
import chalk from 'chalk';
import { basename } from 'path';

export default async function start(options = {}) {
	const { daemon } = options;
	await exec(options);
	if (daemon) {
		const { logsDir, name, $0 } = options;
		const command = basename($0);

		console.log();
		logger.info(`"${name}" started with daemon mode`);

		if (logsDir !== false) {
			logger.info(chalk.gray(`To get logs, run \`${command} log ${name}\``));
		}
		else {
			logger.warn(chalk.gray('Logs disabled'));
		}

		logger.info(chalk.gray(`To get detail, run \`${command} show ${name}\``));
		logger.info(chalk.gray(`To shut down, run \`${command} stop ${name}\``));
		console.log();
	}
}
