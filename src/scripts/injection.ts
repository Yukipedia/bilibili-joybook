import { waitUntilDomLoaded } from '@/utils/helper';

waitUntilDomLoaded<HTMLElement>('#app', false)
	.then(dom => {
		setTimeout(() => {
			dom.setAttribute('data-app', 'true');
		}, 500);
	});

if (window === top) {
	const icon = document.createElement('link');
	icon.rel = 'stylesheet';
	icon.href = 'https://fonts.loli.net/css?family=Roboto:100,300,400,500,700,900|Material+Icons';
	(document.head! || document.documentElement!).appendChild(icon);

	const vendors = document.createElement('script');
	(document.head! || document.documentElement!).appendChild(vendors);
	const vendorsRequest = new XMLHttpRequest();
	vendorsRequest.open('GET', chrome.extension.getURL('js/chunk-vendors.js'), false);
	vendorsRequest.send(null);
	if (vendorsRequest.status === 200) {
		vendors.innerText = vendorsRequest.responseText;
	}

	const inject = document.createElement('script');
	(document.head! || document.documentElement!).appendChild(inject);
	const request = new XMLHttpRequest();
	request.open('GET', chrome.extension.getURL('js/inject.js'), false);
	request.send(null);
	if (request.status === 200) {
		inject.innerText = request.responseText;
	}
} else {
	const inject = document.createElement('script');
	(document.head! || document.documentElement!).appendChild(inject);
	const request = new XMLHttpRequest();
	request.open('GET', chrome.extension.getURL('js/microhost.js'), false);
	request.send(null);
	if (request.status === 200) {
		inject.innerText = request.responseText;
	}
}
