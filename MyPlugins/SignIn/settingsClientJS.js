document.addEventListener('DOMContentLoaded', evt => {
	const a = document.createElement('a');

	a.href = '/SignIn/changePass';
	a.style.textDecoration = 'none';
	a.innerHTML += `<button>Change password</button>`;

	document.getElementsByTagName('main')[0].appendChild(a);
});