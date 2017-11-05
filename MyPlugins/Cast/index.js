const player = require('chromecast-player')();

module.exports = {
	clientJS: {
		filePath: '/Audio/index.html',
		script: 'script.js'
	},

	server: (server, imports, data) => {
		const castRequest = (request, response) => {
			const url = imports.querystring.unescape(request.url);
			const file = url.replace(data.serverURL, '').replace('/cast/', '');

			player.launch(`http://${data.serverURL}/song/${file}`, (err, p) => {
				if (err) {
					response.send({success: false});
				} else {
					p.once('playing', () => {
						response.send({success: true});
					});
				}
			});
		}

		const stopCastingRequest = (request, response) => {
			player.attach((err, p) => {
				if (err)
					response.send({success: false});
				else {
					p.stop();
					response.send({success: true});
				}
			});
		}

		const castIconRequest = (request, response) => {
			response.sendFile(data.path + '/ic_cast_white.svg');
		}

		const serverRequests = [
		{
			name: 'stopCasting',
			func: stopCastingRequest
		},

		{
			name: 'castIcon',
			func: castIconRequest
		},

		{
			name: '',
			func: castRequest
		}
		];

		server.addGetRequest(serverRequests);
	}
}