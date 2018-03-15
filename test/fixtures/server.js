const { PORT = 3000, RESPONSE_DATA } = process.env;

require('http')
	.createServer((req, res) => {
		console.log('[HTTP]', req.url);
		res.end(RESPONSE_DATA || '掂');
	})
	.listen(PORT, () => {
		console.log('test server started');
	});
