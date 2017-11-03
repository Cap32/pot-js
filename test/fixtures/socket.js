
const { PORT = 3000, POT_TESTING } = process.env;

const { Server } = require('promise-ws');

(async function () {
	try {
		const server = await Server.create({ port: PORT });

		server.on('test', async (data) => {
			return data;
		});

		server.on('env', async () => {
			return POT_TESTING;
		});

		console.log('socket server started');
	}
	catch (err) {
		console.error(err);
	}
}());
