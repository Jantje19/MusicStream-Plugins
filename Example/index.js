module.exports = {
	clientJS: {
		filePath: '/Audio/index.html',
		script: 'script.js'
	},

	server: (server, imports, data) => {
		const getRequest = (request, response) => {
			response.send('A response');
		}

		server.addGetRequest([
		{
			name: 'URL',
			func: getRequest
		}
		]);
	},

	hijackRequests: {
		preventDefault: false,
		func: (request, response, next, imports, data) => {
			console.log(request.url);
		}
	},

	menu: {
		url: '/',
		name: 'Example'
	}
}