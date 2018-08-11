import MasterMonitor from './MasterMonitor';
import listenToUnhandledRejection from '../utils/listenToUnhandledRejection';

listenToUnhandledRejection();

const send = (type, payload) =>
	process.connected && process.send({ type, payload });

const listenToStart = async function listenToStart(message) {
	if (message.type === 'start') {
		const options = message.payload;
		const masterMonitor = new MasterMonitor(options);
		const { instances } = options;
		const { ok, errors } = await masterMonitor.spawn({ instances });
		if (ok) send('start');
		else send('error', { errors });
	}
};

process.removeListener('message', listenToStart);
process.on('message', listenToStart);
