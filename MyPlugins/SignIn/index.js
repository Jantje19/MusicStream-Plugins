'use strict';

const tokens = [];
const maxMinDiff = 100;
const tokenLength = 11;
const debugging = false;
const crypto = require('crypto');
const passHash = {
	nSalt: 'd17fa9b231e5eae7',
	passwordHash: '8ecb5af1ff2c34062a2a70b09f81ab8cb2f588ced59264a5d9a1f86a5e53f3a18918af858d6c26e60f13eaa5df4073f3b01965883e0d83ce8e84e3a317294889'
}

function genRandomString(length) {
	return crypto.randomBytes(Math.ceil(length/2))
	.toString('hex')
	.slice(0, length);
}

function sha512(password, salt) {
	const hash = crypto.createHmac('sha512', salt);
	hash.update(password);

	const value = hash.digest('hex');
	return {
		salt: salt,
		passwordHash: value
	}
}

function saltHashPassword(userpassword) {
	const salt = genRandomString(16);
	const passwordData = sha512(userpassword, salt);

	console.log('UserPassword = ' + userpassword);
	console.log('Passwordhash = ' + passwordData.passwordHash);
	console.log('nSalt = ' + passwordData.salt);
}

function sendError(val, response) {
	if (debugging)
		response.send({success: false, error: val, info: val});
	else {
		removeCookie(response);
		response.redirect('/SignIn/?mess=' + val);
	}
}

function getTokenFromCookie(cookieString, querystring) {
	if (cookieString.length > 0) {
		const parsedCookie = querystring.parse(cookieString);

		if (parsedCookie) {
			if ('token' in parsedCookie) {
				return parsedCookie['token'];
			} else return;
		} else return;
	} else return;
}

function dateInRange(date) {
	const now = new Date();
	const diff = now.getTime() - date;

	if (diff / 60000 < maxMinDiff)
		return true;

	return false;
}

function removeToken(token) {
	for (let i = 0; i < tokens.length; i++) {
		if (tokens[i].token == token) {
			tokens.splice(i, 1);
			return;
		}
	}
}

function validizeToken(token, ip, userAgent) {
	for (let i = 0; i < tokens.length; i++) {
		const obj = tokens[i];

		if (debugging)
			console.log(obj.token == token, obj.ip == ip, obj.userAgent == userAgent, dateInRange(obj.date));

		if (obj.token == token && obj.userAgent == userAgent && dateInRange(obj.date)) // && obj.ip == ip
			return true;
	}

	removeToken(token);
	return false;
}

function validizeTokenRequest(request, response, imports, data) {
	if (request.headers) {
		if (request.headers.cookie) {
			if (request.headers.cookie.length > 0) {
				const token = getTokenFromCookie(request.headers.cookie, imports.querystring);

				if (token) {
					if (token.length == tokenLength) {
						if (validizeToken(token, request.connection.remoteAddress, request.headers['user-agent']))
							return true;
						else
							sendError('Invalid token', response);
					} else sendError('Token of invalid length', response);
				} else sendError('Token not found', response);
			} else sendError('Cookie of invalid length', response);
		} else sendError('No token header found', response);
	} else sendError('No headers found', response);

	return false;
}

function checkPass(pass) {
	return sha512(pass, passHash.nSalt).passwordHash === passHash.passwordHash;
}

function setToken(request, response) {
	const token = genRandomString(tokenLength);

	tokens.push({
		token: token,
		date: new Date().getTime(),
		ip: request.connection.remoteAddress,
		userAgent: request.headers['user-agent']
	});

	response.header({
		'Set-Cookie': `token=${token};path=/`
	});

	return token;
}

function removeCookie(response) {
	response.header({
		'Set-Cookie': 'token=;path=/;max-age=-10;expires=Thu, 01 Jan 1970 00:00:00 GMT'
	});
}

module.exports = {
	clientJS: {
		filePath: '/Audio/index.html',
		script: '/clientJS.js'
	},

	server: (server, imports, data) => {
		server.addGetRequest({
			name: 'checkToken',
			func: (request, response) => {
				if (validizeTokenRequest(request, response, imports, data))
					response.send({success: true, valid: true});
			}
		},
		{
			name: 'signOut',
			func: (request, response) => {
				removeCookie(response);
				imports.utils.sendFile(imports.fs, data.path + '/logOut.html', response);
			}
		},
		{
			name: '',
			func: (request, response) => {
				const path = request.path.replace('/SignIn', '');

				if (path.endsWith('/'))
					imports.utils.sendFile(imports.fs, data.path + '/index.html', response);
				else
					imports.utils.sendFile(imports.fs, data.path + path, response);
			}
		});

		server.addPostRequest({
			name: '',
			func: (request, response) => {
				let body = '';

				request.on('data', data => {
					body += data;

					if (body.length > 1e6) {
						sendError('The amount of data is too much', response);
						request.connection.destroy();
					}
				});

				request.on('end', () => {
					if (body.length > 0) {
						const args = imports.querystring.parse(imports.querystring.unescape(body));

						if (args) {
							if ('password' in args) {
								const validPass = checkPass(args.password);

								if (validPass) {
									setToken(request, response);
									response.redirect('/');
								} else sendError('Wrong password', response);
							} else sendError('No password argument found', response);
						} else sendError('No arguments found', response);
					} else sendError('No arguments found', response);
				});
			}
		});
	},

	hijackRequests: {
		preventDefault: true,
		func: (request, response, next, imports, data) => {
			const url = imports.querystring.unescape(request.url);
			const urlArgs = imports.URLModule.parse(url);

			if (urlArgs.pathname) {
				if (urlArgs.pathname.length > 0) {
					if (urlArgs.pathname.replace(/\//g, '').startsWith('SignIn')) {
						next();
						return;
					} else if (urlArgs.pathname == '/' || urlArgs.pathname.endsWith('.js') || urlArgs.pathname.endsWith('.png') || urlArgs.pathname.endsWith('.svg') || urlArgs.pathname.endsWith('.html') || urlArgs.pathname.endsWith('.css')) {
						next();
						return;
					}

				}

			}

			if (request.headers) {
				if (debugging) {
					if (request.headers.host) {
						if (request.headers.host.length > 0) {
							const splitArr = data.serverURL.split(':');
							const IP = splitArr[0];
							const PORT = splitArr[1];

							if (request.headers.host == 'localhost:' + PORT || request.headers.host == data.serverURL) {
								next();
								return;
							}
						}
					}
				}

				if (validizeTokenRequest(request, response, imports, data))
					next();
			}
		}
	},

	menu: {
		url: '/signOut',
		name: 'Sign Out'
	}
}