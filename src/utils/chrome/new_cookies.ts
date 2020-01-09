function get(details: chrome.cookies.Details): Promise<chrome.cookies.Cookie | null> {
	return new Promise(resolve => chrome.cookies.get(details, item => resolve(item)));
}

function getAll(details: chrome.cookies.GetAllDetails): Promise<chrome.cookies.Cookie[]> {
	return new Promise(resolve => chrome.cookies.getAll(details, items => resolve(items)));
}

function set(details: chrome.cookies.SetDetails): Promise<chrome.cookies.Cookie | null> {
	return new Promise(resolve => chrome.cookies.set(details, cookie => resolve(cookie)));
}

function setAll(cookies: chrome.cookies.Cookie[], url: string): Promise<Array<chrome.cookies.Cookie | null>> {
	return new Promise(resolve => {
		Promise.all(cookies.map(cookie => set({
			url,
			name: cookie.name,
			value: cookie.value,
			domain: cookie.domain,
			path: cookie.path,
			secure: cookie.secure,
			httpOnly: cookie.httpOnly,
			expirationDate: cookie.expirationDate,
			storeId: cookie.storeId,
		})))
			.then(resolve);
	});
}


function remove(details: chrome.cookies.Details): Promise<chrome.cookies.Details> {
	return new Promise(resolve => chrome.cookies.remove(details, details => resolve(details)));
}

function removeAll(url: string): Promise<void> {
	return new Promise(resolve => {
		getAll({ url })
			.then(cookies => Promise.all(cookies.map(cookie => remove({ name: cookie.name, url }))))
			.then(() => resolve());
	});
}

function getAllCookieStores(): Promise<chrome.cookies.CookieStore[]> {
	return new Promise(resolve => chrome.cookies.getAllCookieStores(cookies => resolve(cookies)));
}

export { get, getAll, set, setAll, remove, removeAll, getAllCookieStores };

