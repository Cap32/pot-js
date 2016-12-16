
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

export default log4js.getLogger();
