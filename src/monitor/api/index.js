
import handleInfo from './handleInfo';
import handleInfoVerbose from './handleInfoVerbose';

export const createAPIServer = function createAPIServer(monitor, socket) {
	const listen = (eventType, handler) => {
		socket.on(eventType, (data, sock) => {
			handler(monitor, data, (resp) => {
				socket.emit(sock, eventType, resp);
			});
		});
	};

	listen('info', handleInfo);
	listen('infoVerbose', handleInfoVerbose);
};
