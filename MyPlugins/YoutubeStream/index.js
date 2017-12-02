const TOKENS = require('./TOKENS.js');

module.exports = {
	server: (server, imports, data) => {
		function vidStream(request, response) {
			const url = imports.querystring.unescape(request.url);
			let vidId = url.split('/').pop();

			if (vidId.length == 11)
				vidId = 'https://youtube.com/watch?v=' + vidId;

			try {
				const video = imports.ytdl(vidId, { filter: function(format) { return format.container === 'mp4'; } });

				video.on('progress', (chunkLength, downloaded, total) => {
					try {
						process.stdout.cursorTo(0);
						process.stdout.clearLine(1);
						process.stdout.write("DOWNLOADING: " + (downloaded / total * 100).toFixed(2) + '% ');
					} catch (err) {}
				});

				video.on('error', err => {
					response.send({success: false, error: err});
				});

				video.pipe(response);
			} catch (err) {
				response.send({success: false, error: err});
			}
		};

		function vidSearch(request, response) {
			const url = imports.querystring.unescape(request.url);
			const query = url.split('/').pop().replace(/\s/g, '+');
			const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${query}&maxResults=25&key=` + TOKENS.APIKey;

			imports.utils.fetch(youtubeUrl, imports.https, imports.URLModule).then(data => {
				response.send({success: true, data: data});
			}).catch(err => {
				response.send({success: false, error: err});
			});
		}

		function playlistRequest(request, response) {
			const url = imports.querystring.unescape(request.url);
			const splitArr = url.split('/');
			const playlistId = splitArr.pop();
			let pageId = '';

			if (splitArr.length > 3)
				pageId = '&pageToken=' + splitArr.pop();

			const youtubeUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet${pageId}&maxResults=50&playlistId=${playlistId}&key=` + TOKENS.APIKey;
			imports.utils.fetch(youtubeUrl, imports.https, imports.URLModule).then(data => {
				response.send({success: true, data: data});
			}).catch(err => {
				response.send({success: false, error: err});
			});
		}

		server.addGetRequest([
		{
			name: 'getPlaylist',
			func: playlistRequest
		},
		{
			name: 'searchVideo',
			func: vidSearch
		},
		{
			name: 'streamVideo',
			func: vidStream
		},
		{
			name: '',
			func: (request, response) => {
				imports.utils.sendFile(imports.fs, data.path + request.url.replace('YoutubeStream/', ''), response);
			}
		}
		]);
	},
	menu: {
		url: '/',
		name: 'YoutubeStream'
	}
}