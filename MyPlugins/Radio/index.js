module.exports = {
	server: (server, imports, data) => {
		const stations = require('./stations.json');

		function getRequest(request, response) {
			imports.utils.sendFile(imports.fs, data.path + request.url.replace('Radio', ''), response);
		}

		function getStationsRequest(request, response) {
			if (stations.length > 0)
				response.send({success: true, data: stations});
			else
				response.send({success: false, error: 'No stations found in file'});
		}

		function addStationRequest(request, response) {
			const reqUrl = imports.querystring.unescape(request.url);
			const urlQuery = imports.URLModule.parse(reqUrl);

			if (urlQuery.query) {
				const urlAttrs = imports.querystring.parse(urlQuery.query);

				if ('name' in urlAttrs && 'url' in urlAttrs) {
					const url = urlAttrs.url.toString();
					const name = urlAttrs.name.toString();

					if (name.length > 0 && url.length > 0) {
						stations.push({
							url: url,
							name: name
						});

						imports.fs.writeFile(__dirname + '/stations.json', JSON.stringify(stations), err => {
							if (err)
								response.send({success: false, error: 'Couldn\'t write to file: ' + JSON.stringify(err)});
							else
								response.send({success: true, data: stations});
						});
					} else response.send({success: false, error: "Invalid parameters"});
				} else response.send({success: false, error: "Parameters missing"});
			} else response.send({success: false, error: "No URL attributes found"});
		}

		function removeStationRequest(request, response) {
			const reqUrl = imports.querystring.unescape(request.url);
			const urlQuery = imports.URLModule.parse(reqUrl);

			if (urlQuery.query) {
				const urlAttrs = imports.querystring.parse(urlQuery.query);

				if ('name' in urlAttrs) {
					const name = urlAttrs.name.toString();

					if (name.length > 0) {
						const index = stations.map(val => {
							return val.name;
						}).indexOf(name);

						if (index > -1) {
							stations.splice(index, 1);

							imports.fs.writeFile(__dirname + '/stations.json', JSON.stringify(stations), err => {
								if (err)
									response.send({success: false, error: 'Couldn\'t write to file: ' + JSON.stringify(err)});
								else
									response.send({success: true, data: stations});
							});
						} else response.send({success: false, error: "Invalid title"});
					} else response.send({success: false, error: "Invalid parameters"});
				} else response.send({success: false, error: "Parameters missing"});
			} else response.send({success: false, error: "No URL attributes found"});
		}

		function renameStationRequest(request, response) {
			const reqUrl = imports.querystring.unescape(request.url);
			const urlQuery = imports.URLModule.parse(reqUrl);

			if (urlQuery.query) {
				const urlAttrs = imports.querystring.parse(urlQuery.query);

				if ('newName' in urlAttrs && 'oldName' in urlAttrs) {
					const newName = urlAttrs.newName.toString();
					const oldName = urlAttrs.oldName.toString();

					if (newName.length > 0 && oldName.length > 0) {
						const index = stations.map(val => {
							return val.name;
						}).indexOf(oldName);

						if (index > -1) {
							const oldUrl = stations[index].url;

							stations.splice(index, 1);
							stations.push({
								url: oldUrl,
								name: newName
							});

							imports.fs.writeFile(__dirname + '/stations.json', JSON.stringify(stations), err => {
								if (err)
									response.send({success: false, error: 'Couldn\'t write to file: ' + JSON.stringify(err)});
								else
									response.send({success: true, data: stations});
							});
						} else response.send({success: false, error: "Invalid title"});
					} else response.send({success: false, error: "Invalid parameters"});
				} else response.send({success: false, error: "Parameters missing"});
			} else response.send({success: false, error: "No URL attributes found"});
		}

		server.addGetRequest([
		{
			name: 'renameStation',
			func: renameStationRequest
		},
		{
			name: 'removeStation',
			func: removeStationRequest
		},
		{
			name: 'addStation',
			func: addStationRequest
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