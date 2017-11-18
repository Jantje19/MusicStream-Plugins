module.exports = {
	server: (server, imports, data) => {
		const stations = require('./stations.json');

		function getRequest(request, response) {
			imports.utils.sendFile(imports.fs, data.path + request.url.replace('Radio', ''), response);
		}

		function getStationsRequest(request, response) {
			response.send();
		}

		function addStation(request, response) {

		}

		server.addGetRequest([
		{
			name: 'addStation',
			func: addStation
		},
		{
			name: 'getStations',
			func: getStationsRequest
		},
		{
			name: '',
			func: getRequest
		}
		]);
	},
	menu: {
		url: '/'
	}
}