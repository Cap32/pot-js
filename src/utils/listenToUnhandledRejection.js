const unhandledRejection = function unhandledRejection(reason, promise) {
	console.warn('unhandledRejection: ' + reason);
	console.error(promise);
};

export default function listenToUnhandledRejection() {
	process.removeListener('unhandledRejection', unhandledRejection);
	process.on('unhandledRejection', unhandledRejection);
}
