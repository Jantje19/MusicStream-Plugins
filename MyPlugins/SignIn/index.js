'use strict';

const basicAuth = require('express-basic-auth');
const crypto = require('crypto');
const fs = require('fs');

const splitVal = '[$[--]$]';
const usersPath = __dirname + '/users.json';
const unauthorizedPage = fs.readFileSync(__dirname + '/unauth.html').toString() || '<style>font-family: \'Arial\', sans-serif;</style><h1>401 Not Authorized.</h1>';
const defaultUsers = {
	'admin': `6f6107121849e89b0fb121d197fd04c33e83cfa7d417aced9a810cfccbdda4311e721a15df2e0da7686ced713029db640ab03812a19f955ed99cd725b99359c6${splitVal}56823e4c6bf8000e` // pass: admin
};

function mainLogic(users) {
	function randomString(length) {
		length = length || 11;

		return crypto.randomBytes(Math.ceil(length / 2))
		.toString('hex')
		.slice(0,length);
	};

	function sha512(password, salt){
		const hash = crypto.createHmac('sha512', salt);
		hash.update(password);
		const value = hash.digest('hex');

		return {
			salt: salt,
			passwordHash: value
		};
	};

	function saltHashPassword(userpassword) {
		const salt = randomString();
		const passwordData = sha512(userpassword, salt);

		return passwordData;
	};

	function updateUsersFile(users) {
		if (fs.existsSync(usersPath)) {
			fs.readFile(usersPath, users, (err, data) => {
				if (err)
					console.err(err);
				else {
					let parsed = false;

					try {
						if (data.length > 0) {
							data = JSON.parse(data.toString('utf-8'));

							for (key in users)
								data[key] = users[key];

						} else data = users;

						parsed = true;
					} catch (err) {
						console.err('Unable to update file', err);
					}

					if (parsed) {
						fs.writeFile(usersPath, JSON.stringify(data), err => {
							if (err)
								console.err(err);
						});
					}
				}
			});
		} else {
			fs.writeFile(usersPath, JSON.stringify(users), err => {
				if (err)
					console.err(err);
			});
		}
	}


	module.exports = {
		clientJS: [{
			script: 'clientJS.js',
			filePath: '/Audio/index.html'
		}, {
			script: 'settingsClientJS.js',
			filePath: '/settings.html'
		}],

		server: (server, imports, data) => {
			server.addGetRequest({
				name: 'changePass',
				func: (request, response) => {
					imports.utils.sendFile(imports.fs, __dirname + '/changePassword.html', response);
				}
			}, {
				name: 'addUser',
				func: (request, response) => {
					imports.utils.sendFile(imports.fs, __dirname + '/addUser.html', response);
				}
			}, {
				name: '*',
				func: (request, response) => {
					imports.utils.sendFile(imports.fs, __dirname + '/index.html', response);
				}
			});

			server.addPostRequest({
				name: 'changePass',
				func: (request, response) => {
					let body = '';

					request.on('data', data => {
						body += data;

						if (body.length > 1e6) {
							response.send({success: false, error: 'Too much data'});
							request.connection.destroy();
						}
					});

					request.on('end', () => {
						if (body.trim() == '')
							response.redirect('/SignIn/changePass');
						else {
							body = imports.querystring.unescape(body.trim());
							const args = imports.querystring.parse(body);

							if (Object.keys(args).length > 0) {
								if (!('oldPass' in args) || !('newPass' in args) || !('newPass-verify' in args))
									response.send({success: false, error: 'Didn\'t find all the required arguments'})
								else {
									if (args.newPass === args['newPass-verify']) {
										if (request.auth.user in users) {
											const splitPassArr = users[request.auth.user].split(splitVal);

											if (splitPassArr.length == 2) {
												if (args.oldPass == request.auth.password) {
													if (sha512(args.oldPass, splitPassArr[1]).passwordHash == splitPassArr[0]) {
														const hashObj = saltHashPassword(args.newPass);

														users[request.auth.user] = hashObj.passwordHash + splitVal + hashObj.salt;
														updateUsersFile(users);

														response.status(303).header({
															'Location': '/'
														}).end('Successfully changed password for ' + request.auth.user);
														return;
													}
												}
											}

											response.send({success: false, error: 'Incorrect password'});
										} else response.send({success: false, error: 'User not found'})
									} else response.send({success: false, error: 'Passwords don\'t match'})
								}
							} else response.send({success: false, error: 'Something went wrong with parsing the body of the request'})
						}
					});
				}
			}, {
				name: 'addUser',
				func: (request, response) => {
					let body = '';

					request.on('data', data => {
						body += data;

						if (body.length > 1e6) {
							response.send({success: false, error: 'Too much data'});
							request.connection.destroy();
						}
					});

					request.on('end', () => {
						if (body.trim() == '')
							response.redirect('/SignIn/addUser');
						else {
							body = imports.querystring.unescape(body.trim());
							const args = imports.querystring.parse(body);

							if (Object.keys(args).length > 0) {
								if (!('username' in args) || !('pass' in args)  || !('pass-verify' in args))
									response.send({success: false, error: 'Didn\'t find all the required arguments'})
								else {
									if (args.username.trim() != '') {
										if (args.pass === args['pass-verify']) {
											if (!(args.Username in users)) {
												const passHash = saltHashPassword(args.pass);
												let newUserObj = {};

												if (Object.is(defaultUsers, users)) {
													newUserObj[args.username] = passHash.passwordHash + splitVal + passHash.salt;
													users = newUserObj;
												} else {
													users[args.username] = passHash.passwordHash + splitVal + passHash.salt;
													newUserObj = users;
												}

												updateUsersFile(newUserObj);
												response.status(303).header({
													'Location': '/'
												}).end(`Successfully added user '${args.username}'`);
											} else response.send({success: false, error: `Username already exists. Did you want to change the password?: ${request.protocol}://${request.get('host')}/SignIn/changePass?un=${args.username}`})
										} else response.send({success: false, error: 'Passwords don\'t match'})
									} else response.send({success: false, error: 'Username empty'});
								}
							} else response.send({success: false, error: 'Something went wrong with parsing the body of the request'})
						}
					});
				}
			});
		},

		hijackRequests: {
			preventDefault: true,
			func: basicAuth({
				users: users,
				challenge: true,
				realm: randomString(),
				authorizer: (username, password) => {
					if (username in users) {
						const userVal = users[username];
						const splitPassArr = userVal.split(splitVal);

						if (splitPassArr.length == 2)
							return (sha512(password, splitPassArr[1]).passwordHash == splitPassArr[0]);
					}

					return false;
				},
				unauthorizedResponse: req => {
					return unauthorizedPage;
				}
			})
		}
	}
}


// Check if user file exists and run the plugin with it.
(function() {
	const goingWithDefault = errMesg => {
		errMesg = errMesg || '';

		console.wrn('SignIn - Unable to read user file, so going with default...', errMesg, `Defaults: ${Object.keys(defaultUsers).join(',')}`);
	}

	if (fs.existsSync(usersPath)) {
		let data = fs.readFileSync(usersPath);

		if (!data) {
			goingWithDefault();
			mainLogic(defaultUsers);
		} else {
			try {
				data = JSON.parse(data.toString());

				if (Object.keys(data).length > 0)
					mainLogic(data);
				else {
					goingWithDefault();
					mainLogic(defaultUsers);
				}
			} catch (err) {
				goingWithDefault();
				mainLogic(defaultUsers);
			}
		}
	} else {
		goingWithDefault();
		mainLogic(defaultUsers);
	}
})();