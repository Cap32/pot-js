
import handleInfo from './handleInfo';
import { API_GET_INFO } from '../../constants';

export const createAPIServer = function createAPIServer(monitor, socket) {
	const listen = (eventType, handler) => {
		socket.on(eventType, (data, sock) => {
			handler(monitor, data, (resp) => {
				socket.emit(sock, eventType, resp);
			});
		});
	};

	listen(API_GET_INFO, handleInfo);
};
