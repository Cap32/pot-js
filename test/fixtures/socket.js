
require('promise-ws').Server
	.create({ port: process.env.PORT || 3000 })
	.then((server) => {
		server.on('test', (data) => {
			return data;
		});

		server.on('env', () => {
			return process.env.POT_TESTING;
		});

		console.log('socket server started');
	})
	.catch((err) => {
		console.error(err);
	})
;
