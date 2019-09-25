/*
- TODO: Different images for missing album cover and artists
- TODO: You can't assume that the album name is unique. It has to be bound to the artist...
*/

module.exports = {
	server: (server, imports, data) => {
		let timeout;
		const artistImageFilePath = __dirname + '/artistImages.json';
		const artistImagesData = imports.fs.readFileSync(artistImageFilePath, 'utf-8');
		const artistImages = new Proxy(artistImagesData.length > 0 ? JSON.parse(artistImagesData) : {}, {
			set: (target, prop, value) => {
				target[prop] = value;
				const writeToFile = () => {
					imports.fs.writeFile(artistImageFilePath, JSON.stringify(target, null, 2), () => { });
				}
				imports.fs.stat(artistImageFilePath, (err, { mtime }) => {
					if (Date.now() - mtime > 1000)
						writeToFile();
					else {
						if (!timeout)
							timeout = setTimeout(() => {
								timeout = null;
								writeToFile();
							}, 5000);
					}
				});
			}
		});
		let songs;

		function getSongInfo(path) {
			return new Promise((resolve, reject) => {
				imports.fs.exists(path, exists => {
					if (exists) {
						try {
							resolve(imports.id3.read(path));
						} catch (err) {
							console.log('TAGERR', err);
							resolve({});
						}
					} else reject('File does not exist');
				});
			});
		}

		function readFileData(path) {
			return new Promise((resolve, reject) => {
				imports.fs.readFile(path, 'utf-8', (err, data) => {
					if (err)
						reject(err);
					else {
						let json;

						try {
							json = JSON.parse(data);
						} catch (err) {
							console.log('Couldn\'t parse json');
							reject(err);
						}

						if (json)
							resolve(json);
						else
							reject();
					}
				});
			});
		}

		const throwError = err => {
			console.err('Couldn\'t load Organize plugin. Because:', err);
		}

		const updateList = () => {
			imports.fileHandler.getJSON(imports.fs, imports.os, imports.utils, imports.settings).then(data => {
				const songsArr = data.audio.songs;
				const promiseArr = [];

				songsArr.forEach((object, key) => {
					promiseArr.push(new Promise((resolve, reject) => {
						try {
							getSongInfo(object.path + object.fileName, imports.id3, imports.fs).then(tags => {
								console.log('Done reading:', object.fileName, '\t', (key / songsArr.length * 100).toFixed(1));

								const returnObj = {
									fileName: object.fileName,
									tags: {}
								};

								if (tags) {
									returnObj.tags = {
										artist: tags.artist,
										title: tags.title
									}

									if ('album' in tags)
										returnObj.tags.album = tags.album;
								}

								resolve(returnObj);
							}).catch(reject);
						} catch (err) {
							resolve({
								tags: {},
								fileName: object.fileName
							})
						}
					}));
				});

				Promise.all(promiseArr).then(data => {
					console.log('Done!');

					imports.fs.writeFile(__dirname + '/songData.json', JSON.stringify(data), err => {
						if (err)
							console.log('WriteErr', err);
					});

					songs = data;
				}).catch(throwError);
			}).catch(throwError);
		}

		const itunes = async artist => {
			const json = JSON.parse((await imports.utils.fetch(
				`https://itunes.apple.com/search?term=${imports.querystring.escape(artist.toLowerCase())}&limit=1`,
				imports.https,
				imports.URLModule
			)).trim());

			if (json.results.length > 0)
				return json.results[0].artworkUrl100;
			else
				return '';
		}

		if (process.argv.includes('update-organize'))
			updateList();

		Promise.all([readFileData(__dirname + '/songData.json')]).then(data => {
			songs = data[0];
		}).catch(err => {
			throw err;
		});

		server.addGetRequest([
			{
				name: 'data',
				func: (request, response) => {
					if (songs) {
						response.send({
							success: true,
							data: songs,
						});
					} else {
						response.send({
							error: 'Songs not loaded (yet)',
							success: false,
						});
					}
				}
			},
			{
				name: 'getArtistData/:artist',
				func: (request, response) => {
					if ('artist' in request.params) {
						const artist = request.params.artist;
						if (artist in artistImages)
							response.send({ success: true, data: artistImages[artist] });
						else {
							itunes(artist).then(url => {
								if (url.length > 0) {
									artistImages[artist] = url;
									response.send({ success: true, data: url });
								} else {
									response.send({
										error: 'Artist not found',
										success: false
									});
								}
							}).catch(err => {
								console.error(err);
								response.send({
									error: 'Fetch error',
									success: false
								});
							});
						}
					} else {
						response.send({
							error: 'Invalid request',
							success: false,
						});
					}
				}
			},
			{
				name: '',
				func: (request, response) => {
					imports.utils.sendFile(imports.fs, __dirname + '/' + request.url.replace('Organize/', ''), response);
				}
			}
		]);
	},
	menu: {
		url: '/'
	}
}