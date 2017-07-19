
import log4js from 'log4js';
import { resolve } from 'path';
import { ensureDir } from 'fs-extra';

let originMonitorLogger;

export const initMonitorLogger = async function initMonitorLogger(options) {
	const { logsDir, daemon, logLevel } = options;

	if (!daemon) {
		originMonitorLogger = log4js.getLogger();
		originMonitorLogger.setLevel(logLevel);
		return originMonitorLogger;
	}

	await ensureDir(logsDir);

	const inDir = (name) => resolve(logsDir, `${name}.log`);

	log4js.configure({
		appenders: [
			{
				type: 'file',
				filename: inDir('out'),
				level: logLevel,
				maxLogSize: 10485760, // 10MB
				backups: 3,
				compress: true,
				category: 'out',
			},
			{
				type: 'logLevelFilter',
				level: 'ERROR',
				appender: {
					type: 'file',
					filename: inDir('error'),
					maxLogSize: 10485760, // 10MB
					backups: 3,
					compress: true,
				},
			},
		],
	});

	originMonitorLogger = log4js.getLogger('out');
	originMonitorLogger.setLevel(logLevel);
	return originMonitorLogger;
};

export default new Proxy({}, {
	get(target, key) {
		return originMonitorLogger[key];
	}
});
