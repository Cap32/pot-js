
import log4js from 'log4js';

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

export const logger = log4js.getLogger();

export const setLevel = (level = 'INFO') => {
	logger.setLevel(level);
	return logger;
};
