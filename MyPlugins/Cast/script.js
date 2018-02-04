document.addEventListener('DOMContentLoaded', evt => {
	const button = document.createElement('button');

	button.id = 'castBtn';
	button.title = 'Cast song';
	button.innerHTML = '<img src="/Cast/castIcon/">';

	button.setAttribute('activated', 'false');
	button.addEventListener('click', evt => {
		if (queue[queueIndex]) {
			fetch('/Cast/' + queue[queueIndex]).then(response => {
				response.json().then(json => {
					if (json.success)
						button.setAttribute('activated', 'true');
					else
						alert('Casting not working...');
				});
			}).catch(err => {
				console.error('An error occurred', err);
			});
		}
	});

	document.getElementById('right').appendChild(button);
});