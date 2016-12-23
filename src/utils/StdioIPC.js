
import logger from './logger';
import { serialize, deserialize } from './serialize';

export default class StdioIPC {
	constructor(process) {
		this._process = process;
	}

	on(command, callback) {
		this._process.on('message', (message) => {
			const data = deserialize(message.toString());
			if (command === data.command) {
				callback(data.payload);
			}
		});
		return this;
	}

	send(command, payload) {
		logger.trace('send', this._process.connected);
		if (this._process.connected) {
			this._process.send(serialize({ command, payload }));
		}
		return this;
	}
}
