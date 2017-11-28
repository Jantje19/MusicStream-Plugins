module.exports = {
	clientJS: {
		filePath: '/Audio/index.html',
		script: 'script.js'
	},

	server: (server, imports, data) => {
		const request = (request, response) => {
			response.send('Yay');
		}

		const serverRequests = [
		{
			name: '',
			func: request
		}
		];

		server.addGetRequest(serverRequests);
	}
}
