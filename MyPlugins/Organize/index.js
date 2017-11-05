/*
- TODO: Different images for missing album cover and artists
- TODO: You can't assume that the album name is unique. It has to be bound to the artist...
*/

module.exports = {
	server: (server, imports, data) => {
		let songs, songTitles, artistImages = {};

		const throwError = err => {
			console.err('Couldn\'t load Organize plugin. Because:', err);
		}

		imports.fileHandler.getJSON(imports.fs, imports.os, imports.utils).then(data => {
			const promiseArr = [];

			songTitles = data.audio.songs.map(val => {return val.fileName});
			data.audio.songs.forEach((object, key) => {
				promiseArr.push(new Promise((resolve, reject) => {
					imports.fileHandler.getSongInfo(object.path + object.fileName, imports.id3, imports.fs).then(tags => {
						// console.log('Done reading', object.fileName, key / data.audio.songs.length * 100);
						if (tags.image) {
							if (tags.image.imageBuffer) {
								if (tags.image.imageBuffer.length > 1e7)
									delete tags.image;
							}
						}

						resolve({
							tags: tags,
							fileName: object.fileName
						});
					}).catch(reject);
				}));
			});

			Promise.all(promiseArr).then(data => {
				console.log('Done!');
				songs = data;
			}).catch(throwError);
		}).catch(throwError);

		server.addGetRequest([
		{
			name: 'data',
			func: (request, response) => {
				if (songs) {
					response.send({
						data: songs,
						success: true
					});
				} else {
					response.send({
						success: false,
						error: 'Songs not loaded (yet)'
					});
				}
			}
		},
		{
			name: 'getArtistData',
			func: (request, response) => {
				const url = imports.querystring.unescape(request.url);
				const splitArray = url.split('/');

				function fetchArtistData(artistName) {
					// artistName = imports.querystring.escape(artistName);
					const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${artistName}&api_key=f02456f630621a02581b2143a67372f0&format=json&autocorrect=1`;

					return new Promise((resolve, reject) => {
						imports.utils.fetch(url, imports.https, imports.URLModule).then(json => {
							if (json.artist) resolve(json.artist);
							else if (json.error) reject(json.message);
						}).catch(reject);
					});
				}
				if (splitArray.length > 2) {
					const artist = splitArray.pop().trim();

					if (artist in artistImages)
						response.send({success: true, data: artistImages[artist]});
					else {
						fetchArtistData(artist).then(data => {
							artistImages[artist] = data;
							response.send({success: true, data: data});
						}).catch(err => {
							console.log(err);
							response.send({success: false, error: err});
						});
					}
				} else response.send({success: false, error: 'Artist not found in URL'});
			}
		},
		{
			name: '',
			func: (request, response) => {
				// if (request)
				// response.sendFile(data.path + '/index.html');
				imports.utils.sendFile(imports.fs, data.path + request.url.replace('Organize/', ''), response);
			}
		}
		]);
	},
	menu: {
		url: '/'
	}
}