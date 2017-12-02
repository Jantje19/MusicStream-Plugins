const {exec} = require('child_process');

module.exports = {
	clientJS: {
		script: 'clientJS.js',
		filePath: '/Audio/index.html'
	},

	server: (server, imports, data) => {
		let socket;
		const WebSocket = require('ws');
		const wss = new WebSocket.Server({ port: 1337 });

		wss.on('connection', ws => {
			socket = ws;
		});

		server.addGetRequest({
			name: 'openOnServer',
			func: (request, response) => {
				exec(`exo-open --launch WebBrowser "http://${data.serverURL}/Sync/?receiver"`, (err, stdout, stderr) => {
					if (err) {
						console.err(err);
						response.send({success: false, error: JSON.stringify(err)});
					} else {
						// response.send({success: true});
						response.redirect(`http://${data.serverURL}/Sync/`);
					}
				});
			}
		},
		{
			name: '',
			func: (request, response) => {
				const url = imports.querystring.unescape(request.url);
				const queryString = imports.URLModule.parse(url).query;

				console.log(queryString, url.endsWith('/'));

				if (queryString) {
					const args = imports.querystring.parse(queryString);

					if ('receiver' in args)
						imports.utils.sendFile(imports.fs, __dirname + '/receiver.html', response);
					else
						imports.utils.sendFile(imports.fs, __dirname + '/sender.html', response);
				} else if (url.endsWith('/')) {
					imports.utils.sendFile(imports.fs, __dirname + '/sender.html', response);
				} else imports.utils.sendFile(imports.fs, data.path + request.url.replace('Sync', ''), response);
			}
		});

		server.addPostRequest({
			name: 'playSongs',
			func: (request, response) => {
				let body = '';
				const url = imports.querystring.unescape(request.url);

				request.on('data', data => {
					body += data;

					if (body.length > 1e6) {
						response.send({success: false, error: 'The amount of data is too much', info: 'The connection was destroyed because the amount of data passed is too much'});
						request.connection.destroy();
					}
				});

				request.on('end', () => {
					let json;

					try {
						json = JSON.parse(body);
					} catch (err) {
						response.send({success: false, error: 'Couln\'t parse JSON'});
						return;
					}

					if (json) {
						if (json instanceof Object) {
							if ('songs' in json) {
								if (json.songs instanceof Array) {
									if (socket) {
										socket.send(JSON.stringify(json.songs));
										response.send({success: true, data: json.songs});
									} else response.send({success: false, error: 'Socket not created (yet)'});
								} else response.send({success: false, error: 'Songs parameter is not an array'});
							} else response.send({success: false, error: 'No "songs" parameter found'});
						} else response.send({success: false, error: 'Not a JSON Object'});
					} else response.send({success: false, error: 'No query parameter'});
				});
			}
		});
	}
}
