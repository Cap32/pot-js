
import { resolve } from 'path';
import { ensureDirSync } from 'fs-promise';
import log4js from 'log4js';

export default async function getFileLogger(logsDir, logLevel = 'INFO') {
	await ensureDirSync(logsDir);

	const inDir = (name) => resolve(logsDir, `${name}.log`);

	log4js.configure({
		appenders: [
			{
				type: 'file',
				filename: inDir('out'),
				level: 'INFO',
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
		levels: {
			'[all]': logLevel,
		},
	});

	return log4js.getLogger('out');
}
