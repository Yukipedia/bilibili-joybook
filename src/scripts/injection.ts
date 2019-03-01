import { waitUntilDomLoaded } from '@/utils/helper';

waitUntilDomLoaded<HTMLElement>('#app', false)
	.then(dom => {
		setTimeout(() => {
			dom.setAttribute('data-app', 'true');
		}, 500);
	});

const extensionID = document.createElement('script');
extensionID.innerText = `window.joybook = { id: '${chrome.runtime.id}' }`;
extensionID.onload = () => extensionID.remove();
(document.head! || document.documentElement!).appendChild(extensionID);

const icon = document.createElement('link');
icon.rel = 'stylesheet';
icon.href = 'https://fonts.loli.net/css?family=Roboto:100,300,400,500,700,900|Material+Icons';
(document.head! || document.documentElement!).appendChild(icon);

const s = document.createElement('script');
(document.head! || document.documentElement!).appendChild(s);
const request = new XMLHttpRequest();
request.open('GET', chrome.extension.getURL('js/inject.js'), false);
request.send(null);
if (request.status === 200) {
	s.innerText = request.responseText;
}
