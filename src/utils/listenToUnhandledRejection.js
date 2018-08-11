const unhandledRejection = function unhandledRejection(reason, promise) {
	console.warn('unhandledRejection: ' + reason);
	console.error(promise);
};

export default function listenToUnhandledRejection() {
	if (process.env.NODE_ENV !== 'production') {
		process.removeListener('unhandledRejection', unhandledRejection);
		process.on('unhandledRejection', unhandledRejection);
	}
}
