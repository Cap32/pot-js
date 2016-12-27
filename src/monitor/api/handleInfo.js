
const handleInfo = (monitor, _, callback) => {
	callback(monitor.toJSON());
};

export default handleInfo;
