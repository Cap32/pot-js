
process.on('message', (buf) => {

	// eslint-disable-next-line
	const config = eval(`(${buf.toString()})`);

	require('http').createServer((req, res) => {
		console.log('[HTTP]', req.url);
		res.end('hello, pot-js');
	}).listen(3000);

});
