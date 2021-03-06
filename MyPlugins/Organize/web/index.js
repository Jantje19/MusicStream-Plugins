let displayActive = false;

JSON.sort = function(o) {
	const isObject = (v) => ('[object Object]' === Object.prototype.toString.call(v));

	if (Array.isArray(o)) {
		return o.sort().map(v => isObject(v) ? JSON.sort(v) : v);
	} else if (isObject(o)) {
		return Object
		.keys(o)
		.sort()
		.reduce((a, k) => {
			if (isObject(o[k])) {
				a[k] = JSON.sort(o[k]);
			} else if (Array.isArray(o[k])) {
				a[k] = o[k].map(v => isObject(v) ? JSON.sort(v) : v);
			} else {
				a[k] = o[k];
			}

			return a;
		}, {});
	}

	return o;
}

function showDisplay(html) {
	const displayElement = document.getElementById('display');

	displayElement.innerHTML = html;
	displayElement.style.display = 'block';
	displayActive = true;
}

function playSelected() {
	const songs = [];

	document.getElementById('songs').childNodes.forEach((object, key) => {
		if (object.getElementsByTagName('input')[0].checked)
			songs.push(object.id);
	});

	if (songs.length > 0)
		window.location = location.origin + '?queue=' + songs.join(',');
}

const promises = [new Promise((resolve, reject) => {
	document.addEventListener('DOMContentLoaded', evt => {
		window.addEventListener('click', evt => {
			const displayElement = document.getElementById('display');

			if (displayActive && evt.target != displayElement  && !displayElement.contains(evt.target))
				displayElement.style.display = 'none';
		});

		window.addEventListener('keyup', evt => {
			const displayElement = document.getElementById('display');

			if (displayActive && evt.key == 'Escape')
				displayElement.style.display = 'none';
		});

		resolve();
	});
}), fetch('data', {credentials: 'same-origin'})];

Promise.all(promises).then(data => {
	response = data.filter(val => {return val instanceof Response})[0];

	response.json().then(data => {
		if (data.success) {
			const albums = {};
			const artists = {};
			const uncategorized = [];
			const displayBoxes = (object, element, subtitleFunc, type) => {
				const buttons = [];

				object = JSON.sort(object);
				for (key in object) {
					const subtitle = subtitleFunc(key);
					const buttonElement = document.createElement('button');
					const btnClick = evt => {
						let html = `<h2>${evt.currentTarget.title}</h2><label for="checkAll">Check all</label><input id="checkAll" type="checkbox"/><hr><div id="songs">`;
						evt.stopPropagation();

						object[evt.currentTarget.title].forEach((object, key) => {
							let title = object.fileName;
							const tags = object.tags;

							if (tags) {
								if ('title' in tags && 'artist' in tags)
									title = tags.artist + ' - ' + tags.title;
							}

							html += `<div id="${object.fileName}"><input id="${title}" type="checkbox"><label for="${title}">${title}</label></div>`;
						});

						html += '</div><button onclick="playSelected()">Play</button>';
						showDisplay(html);

						document.getElementById('checkAll').addEventListener('change', evt => {
							Array.from(document.getElementById('songs').getElementsByTagName('div')).forEach((object, key) => {
								const checkBoxElement = object.getElementsByTagName('input')[0];

								if (evt.target.checked)
									checkBoxElement.checked = true;
								else
									checkBoxElement.checked = false;
							});
						});
					}

					if (type == 'album') {
						const urlCreator = window.URL || window.webkitURL;
						fetch('/songInfo/' + object[key][0].fileName, {credentials: 'same-origin'}).then(response => {
							response.json().then(json => {
								if (json.image) {
									const arrayBufferView = new Uint8Array(json.image.imageBuffer.data);
									const blob = new Blob([arrayBufferView], {type: "image/" + json.image.mime});
									const imageUrl = urlCreator.createObjectURL(blob);

									buttonElement.getElementsByClassName('artwork')[0].style.backgroundImage = `url(${imageUrl})`;
								}
							});
						});
					} else if (type == 'artist') {
						fetch('getArtistData/' + key, {credentials: 'same-origin'}).then(response => {
							response.json().then(data => {
								if (data.success)
									buttonElement.getElementsByClassName('artwork')[0].style.backgroundImage = `url(${data.data})`;
							});
						});
					}

					buttonElement.title = key;
					buttonElement.className = type;
					buttonElement.addEventListener('click', btnClick, false);
					buttonElement.innerHTML += `<div class="artwork"></div><div><h3>${key}</h3><span>${subtitle}</span></div>`;
					buttons.push(buttonElement);
					element.appendChild(buttonElement);
				}

				return buttons;
			}

			data.data.forEach((object, key) => {
				const tags = object.tags;
				const addToObject = (array, name, object) => {
					if (name in array)
						array[name].push(object);
					else
						array[name] = [object];
				}

				if (Object.keys(tags).length > 0) {
					if ('title' in tags) {
						if ('album' in tags && 'artist' in tags) {
							addToObject(albums, tags.album, object);
							addToObject(artists, tags.artist, object);
						} else if ('album' in tags) {
							addToObject(albums, tags.album, object);
						} else if ('artist' in tags) {
							addToObject(artists, tags.artist, object);
						} else uncategorized.push(object);
					} else uncategorized.push(object);
				} else uncategorized.push(object);
			});

			const albumElement = document.getElementById('albums');
			const artistElement = document.getElementById('artists');

			albumElement.innerHTML = '';

			if (uncategorized.length > 0)
				displayBoxes({'<i>Uncategorized</i>': uncategorized}, albumElement, key => {return uncategorized.length});

			displayBoxes(albums, albumElement, key => {
				return albums[key][0].tags.artist;
			}, 'album');

			artistElement.innerHTML = '';
			displayBoxes(artists, artistElement, key => {
				const length = artists[key].length;

				return length + ((length > 1) ? ' songs' : ' song');
			}, 'artist');
		} else alert(data.error);
	}).catch(console.error);
}).catch(console.error);