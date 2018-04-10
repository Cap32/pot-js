const { PORT = 3000, RESPONSE_DATA } = process.env;

require('http')
	.createServer((req, res) => {
		console.log('[HTTP]', req.url);
		res.end(RESPONSE_DATA || '掂');
	})
	.listen(PORT, () => {
		console.log('test server started');

		var desiredLoadFactor = 0.5;

		function blockCpuFor(ms) {
			var now = new Date().getTime();
			var result = 0;
			while (true) {
				result += Math.random() * Math.random();
				if (new Date().getTime() > now + ms) return result;
			}
		}

		function start() {
			blockCpuFor(1000 * desiredLoadFactor);
			setTimeout(start, 1000 * (1 - desiredLoadFactor));
		}

		start();
	});
