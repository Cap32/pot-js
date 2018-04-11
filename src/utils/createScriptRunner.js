import defaultLogger from 'pot-logger';
import spawn from 'cross-spawn';
import npmPath from 'npm-path';

export default function createScriptRunner(options = {}) {
	return function runScript(command, ...args) {
		if (!command) return;

		const { logger = defaultLogger, silence, ...spawnOptions } = options;
		let { env } = spawnOptions;

		const $PATH = npmPath.getSync(spawnOptions);
		if (env) {
			env[npmPath.PATH] = $PATH;
		}
		else {
			env = {
				...process.env,
				[npmPath.PATH]: $PATH,
			};
		}

		const child = spawn(command, args, {
			...spawnOptions,
			env,
			shell: true,
		});

		if (!silence) {
			if (child.stdout) {
				child.stdout.on('data', (data) => {
					logger.info(`${data}`);
				});
			}

			if (child.stderr) {
				child.stderr.on('data', (data) => {
					logger.error(`${data}`);
				});
			}

			child.on('close', (code) => {
				logger.info(`child process exited with code ${code}`);
			});
		}

		return child;
	};
}
