module.exports = {
	clientJS: {
		filePath: '/Audio/index.html',
		script: 'script.js'
	},

	server: (app, utils, path) => {
		app.get('/URL/*', (request, response) => {
			response.send('A response');
		});
	}
}