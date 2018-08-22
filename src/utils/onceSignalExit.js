import { signals } from 'signal-exit';

export default function onceSignalExit(callback) {
	const handler = () => {
		signals().forEach((s) => process.removeListener(s, handler));
		callback();
	};
	signals().forEach((signal) => {
		process.on(signal, handler);
	});
}
