document.addEventListener('DOMContentLoaded', evt => {
	const btnElem = document.createElement('button');

	btnElem.innerText = 'Sign Out';
	btnElem.onclick = evt => {
		const p = window.location.protocol + '//';

		window.location = window.location.href.replace(p, p + 'logout:password@');
	}

	document.getElementById('overflowMenu').appendChild(btnElem);
});