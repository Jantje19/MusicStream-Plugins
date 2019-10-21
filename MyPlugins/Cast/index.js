module.exports = {
	clientJS: [
		{
			script: 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js',
			filePath: '/Audio/index.html'
		},
		{
			filePath: '/Audio/index.html',
			script: 'script.js'
		}
	],
	server: server => {
		server.addGetRequest([
			{
				name: 'castIcon',
				func: (_, response) => {
					response.sendFile(__dirname + '/ic_cast_white.svg');
				}
			}
		]);
	}
}