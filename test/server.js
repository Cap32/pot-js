
const { DEV_SERVER_PORT = 3000 } = process.env;

require('http').createServer((req, res) => {
	console.log('[HTTP]', req.url);
	res.end('hello, pot-js');
}).listen(DEV_SERVER_PORT, () => {
	console.log('test server started');
});
