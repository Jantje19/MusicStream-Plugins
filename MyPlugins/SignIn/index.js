'use strict';

const basicAuth = require('express-basic-auth');
const querystring = require('querystring');
const URLModule = require('url');
const crypto = require('crypto');
const fs = require('fs');

const splitVal = '[$[--]$]';
const logOfLoggedInUsers = [];
const usersPath = __dirname + '/users.json';
const unauthorizedPage = fs.readFileSync(__dirname + '/unauth.html', 'utf-8');

const date = new Date();
fs.appendFileSync('./authLog.txt', '-'.repeat(5) + ` ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ` + '-'.repeat(5) + '\n');

function mainLogic(users) {
	function sha512(password, salt) {
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

	function logDate() {
		const date = new Date();

		function convertToDoubleDigit(num) {
			if (num.toString().length < 2)
				return "0" + num;
			else
				return num;
		}

		return `${convertToDoubleDigit(date.getHours())}:${convertToDoubleDigit(date.getMinutes())}:${convertToDoubleDigit(date.getSeconds())}`;
	}

	module.exports = {
		hijackRequests: {
			preventDefault: true,
			func: (request, response, next) => {
				basicAuth({
					users,
					challenge: true,
					realm: 'MusicStream server',
					authorizer: (username, password, req) => {
						if (username in users) {
							const userVal = users[username];
							const splitPassArr = userVal.split(splitVal);

							if (splitPassArr.length == 2) {
								if (basicAuth.safeCompare(sha512(password, splitPassArr[1]).passwordHash, splitPassArr[0])) {
									if (!logOfLoggedInUsers.includes(req.connection.remoteAddress)) {
										fs.appendFileSync('./authLog.txt', `${logDate()}: ${req.connection.remoteAddress} - ${req.headers['user-agent']}\tAUTH\n`);
										logOfLoggedInUsers.push(req.connection.remoteAddress);
									}

									return true;
								}
							}
						}

						return false;
					},
					unauthorizedResponse: req => {
						fs.appendFileSync('./authLog.txt', `${logDate()}: ${req.connection.remoteAddress} - ${req.headers['user-agent']}\tUNAUTH\n`);
						return unauthorizedPage;
					}
				})(request, response, next);
			}
		}
	}
}

// Check if user file exists and run the plugin with it.
(function () {
	// Check flag
	if (process.argv.find(val => val.toLowerCase() == '--noauth'))
		return;
	else {
		if (fs.existsSync(usersPath)) {
			let data = fs.readFileSync(usersPath);

			if (!data)
				throw Error('SignIn: Unable to read user file');
			else {
				try {
					data = JSON.parse(data.toString());

					if (Object.keys(data).length > 0)
						mainLogic(data);
					else
						throw Error('SignIn: Unable to parse user file');
				} catch (err) {
					throw Error('SignIn: Unable to parse user file');
					console.error(err);
				}
			}
		} else {
			throw Error('SignIn: Unable to locate user file');
		}
	}
})();