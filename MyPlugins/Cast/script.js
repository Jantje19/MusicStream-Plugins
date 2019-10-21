document.addEventListener('DOMContentLoaded', evt => {
	const button = document.createElement('button');

	button.id = 'castBtn';
	button.title = 'Cast song';
	button.innerHTML = '<img src="/Cast/castIcon/">';

	button.setAttribute('activated', 'false');

	/* Cast */
	const initializeCastApi = () => {
		console.log('initializeCastApi');

		const sessionRequest = new chrome.cast.SessionRequest(
			chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
		const apiConfig = new chrome.cast.ApiConfig(
			sessionRequest, sessionListener, receiverListener);
		chrome.cast.initialize(apiConfig, onInitSuccess, onError);
	};

	if (!chrome.cast || !chrome.cast.isAvailable) {
		setTimeout(initializeCastApi, 1000);
	}

	function onInitSuccess() {
		console.log('onInitSuccess');
	}

	function onError(e) {
		console.log('onError', e);
	}

	function sessionListener(e) {
		console.log('sessionListener', e);
	}

	function receiverListener(availability) {
		console.log('receiverListener', availability);

		if (availability === chrome.cast.ReceiverAvailability.AVAILABLE)
			button.setAttribute('activated', 'true');
	}

	function onSessionRequestSuccess(session) {
		console.log('onSessionRequestSuccess', session);

		const mediaInfo = new chrome.cast.media.MediaInfo(audio.src, "audio/mp3");
		const request = new chrome.cast.media.LoadRequest(mediaInfo);
		session.loadMedia(request, onMediaLoadSuccess, onError);
	}

	function onMediaLoadSuccess(e) {
		console.log('onMediaLoadSuccess', e);
	}

	button.addEventListener('click', evt => {
		chrome.cast.requestSession(onSessionRequestSuccess, onError);
	});
	/**/

	document.getElementById('right').appendChild(button);
});