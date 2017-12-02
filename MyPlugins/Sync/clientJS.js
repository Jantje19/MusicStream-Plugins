function loaded() {
	const newBtn = document.createElement('button');
	const containerNode = document.getElementById('queueContainer');
	const referenceButton = Array.from(containerNode.getElementsByTagName('button')).shift();

	newBtn.style.float = 'right';
	newBtn.title = 'Sync queue to other device';
	newBtn.innerHTML = '<img src="/Sync/ic_send_black.svg">';

	newBtn.onclick = evt => {
		if (queue.length > 0) {
			const data = {};

			data.songs = queue;
			fetch('/Sync/playSongs', {method: 'POST', body: JSON.stringify(data)}).then(response => {
				response.json().then(json => {
					if (json.success)
						alert('Successfully sent');
					else
						alert('Error: ' + json.error);
				});
			}).catch(console.error);
		} else console.log('Sync - Queue empty');
	}

	containerNode.insertBefore(newBtn, referenceButton);
}