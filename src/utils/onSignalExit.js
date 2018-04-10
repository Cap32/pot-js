import { signals } from 'signal-exit';

export default function onSignalExit(callback) {
	signals().forEach((signal) => {
		process.on(signal, () => {
			callback(signal);
		});
	});
}
