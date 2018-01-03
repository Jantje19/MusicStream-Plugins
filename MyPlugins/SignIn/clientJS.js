let validToken = false;
const promiseArray = [];

String.prototype.replaceAt = function(index, replacement) {
	return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

String.prototype.allIndexesOf = function(char) {
	const indices = [];

	for (let i = 0; i < this.length; i++) {
		if (this[i] == char)
			indices.push(i);
	}

	return indices;
}

// HTMLElement
Object.prototype.css = function(obj) {
	function formatAtt(att) {
		const allIndexes = att.allIndexesOf('-');

		allIndexes.forEach((object, key) => {
			att = att.replaceAt(object + 1, att.charAt(object + 1).toUpperCase());
		});

		return att.replace(/-/g, '');
	}


	if (this instanceof HTMLElement) {
		for (key in obj)
			this.style[formatAtt(key)] = obj[key];
	} else console.warn(this, 'is not a HTMLElement');
}

promiseArray.push(get('/SignIn/checkToken/'));
promiseArray.push(new Promise((resolve, reject) => {
	document.addEventListener('DOMContentLoaded', evt => {
		const div = document.createElement('div');

		div.css({
			left: 0,
			right: 0,
			width: '100%',
			height: '100%',
			display: 'flex',
			position: 'fixed',
			'z-index': 100000000,
			'align-items': 'center',
			'justify-content': 'center',
			'overscroll-behavior': 'none',
			'background-color': 'rgba(0, 0, 0, 0.8)'
		});

		div.innerHTML = `
		<div style="background-color: #16a085; padding: 5% 10%; background-color: #16a085; box-shadow: 0 0 10px rgba(0, 0, 0, 0.8); text-shadow: 0 0 5px rgba(0, 0, 0, 0.3);">
		<h2 style="color: white; margin-bottom: 10px">Log In</h2>
		<form action="/SignIn/" method="post">
		<input style="color: white; padding: 3px 8px; background: none; border-radius: 20px; border: white 2px solid;" name="password" type="password"/>
		<button style="color: white; cursor: pointer; padding: 3px 8px; background: none; border-radius: 20px; border: white 2px solid;">Log In</button> </form>
		</div>
		`;

		document.body.style.overflowY = 'hidden';
		document.body.insertBefore(div, document.body.children[0]);
		resolve(div);
	});
}));

Promise.all(promiseArray).then(data => {
	const fetchVal = data[0];
	const domVal = data[1];

	if (fetchVal.success) {
		if (fetchVal.valid) {
			domVal.style.display = 'none';
			document.body.style.overflowY = 'unset';
		}
	} else console.error(fetchVal);
}).catch(console.error);