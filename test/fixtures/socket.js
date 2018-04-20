require('promise-ws')
	.Server.create({ port: process.env.PORT || 3000 })
	.then((server) => {
		server.reply('test', (data) => {
			return data;
		});
		server.reply('env', () => {
			return process.env.POT_ENV_VAR;
		});
		console.log('socket server started');
	})
	.catch((err) => {
		console.error('socket server failed', err);
	});
