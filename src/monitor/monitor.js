import MasterMonitor from './MasterMonitor';

if (process.env !== 'production') {
	process.on('unhandledRejection', (reason, promise) => {
		console.warn('unhandledRejection: ' + reason);
		console.error(promise);
	});
}

const send = (type, payload) =>
	process.connected && process.send({ type, payload });

process.on('message', async (message) => {
	if (message.type === 'start') {
		const masterMonitor = new MasterMonitor(message.payload);
		const { ok, errors } = await masterMonitor.spawn();
		if (ok) send('start');
		else send('error', { errors });
	}
});
