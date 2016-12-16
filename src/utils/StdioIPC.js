
class StdioIPC {
	constructor(process) {
		this._process = process;
	}

	on(command, callback) {
		this._process.on('message', (message) => {
			const data = JSON.parse(message);
			if (command === data.command) {
				callback(data.payload);
			}
		});
		return this;
	}

	send(command, payload) {
		if (this._process.connected) {
			this._process.send(JSON.stringify({ command, payload }));
		}
		return this;
	}
}

module.exports = StdioIPC;
