
import { resolve } from 'path';
import { ensureDir } from 'fs-promise';
import log4js from 'log4js';

let monitorLogger;

log4js.configure({
	appenders: [{
		type: 'console',
		layout: {
			type: 'pattern',
			pattern: '%[%p%] %m',
		},
	}],
	levels: {
		'[all]': 'INFO',
	},
});

const logger = log4js.getLogger();

export default logger;

export const setLevel = (newLevel) => {
	logger.setLevel(newLevel);
	return logger;
};

export const setMonitorLogger = async function setMonitorLogger(options) {
	const { logsDir, daemon, logLevel } = options;

	if (!daemon) {
		monitorLogger = log4js.getLogger();
		monitorLogger.setLevel(logLevel);
		return monitorLogger;
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

	monitorLogger = log4js.getLogger('out');
	monitorLogger.setLevel(logLevel);
	return monitorLogger;
};

export const getMonitorLogger = function getMonitorLogger() {
	return monitorLogger;
};
