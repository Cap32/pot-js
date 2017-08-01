
import { logger } from 'pot-logger';
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
		if (this._process.connected) {
			if (payload instanceof Error) {
				const { message, code, stack } = payload;
				payload = { message, code, stack };
			}
			this._process.send(serialize({ command, payload }));
		}
		else {
			logger.warn('ipc disconnected');
		}
		return this;
	}
}
