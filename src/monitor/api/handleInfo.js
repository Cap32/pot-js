
const handleInfo = (monitor, _, callback) => {
	const { data, ...monitorInfo, } = monitor.toJSON();
	callback({
		...monitorInfo,
		...data,
	});
};

export default handleInfo;
