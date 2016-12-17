
require('http').createServer((req, res) => {
	console.log('[HTTP]', req.url);
	res.end('hello, pot-js');
}).listen(3000);
