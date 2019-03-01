
const getChromeCookies = (details: chrome.cookies.GetAllDetails): Promise<chrome.cookies.Cookie[]> => {
	return new Promise(resolve => {
		chrome.cookies.getAll(details, items => {
			return resolve(items);
		});
	});
};

const setChromeCookies = (details: chrome.cookies.SetDetails): Promise<chrome.cookies.Cookie> => {
	return new Promise(resolve => {
		chrome.cookies.set(details, cookies => {
			return resolve(cookies as chrome.cookies.Cookie);
		});
	});
};

const removeChromeCookies = (details: chrome.cookies.Details) => {
	return new Promise(resolve => {
		chrome.cookies.remove(details, details => {
			return resolve(details);
		});
	});
};

// TODO: 貌似与本意偏离了 感觉不需要把所有cookies存在这 而只是单纯的加上异步的方法而已
export default class ChromeAsyncCookies {
	private cookiesStore: chrome.cookies.Cookie[];

	constructor(details: chrome.cookies.GetAllDetails) {
		this.cookiesStore = [];

		chrome.cookies.onChanged.addListener(changeInfo => {
			this.cookiesStore = this.cookiesStore.map(cookie => {
				if (cookie.name === changeInfo.cookie.name) {
					return changeInfo.cookie;
				}
				return cookie;
			});
		});

		// @ts-ignore 获取cookie的所有项目
		return new Promise(resolve => {
			getChromeCookies(details)
				.then(result => {
					this.cookiesStore = result;
					resolve(this);
				});
		});
	}

	public get cookies() {
		return this.cookiesStore;
	}

	public get(name: string) {
		return this.cookies.filter(cookie => cookie.name === name);
	}

	public async nativeGetAll(details: chrome.cookies.GetAllDetails) {
		const result = await getChromeCookies(details);
		return result;
	}

	public async set(details: chrome.cookies.SetDetails) {
		return await setChromeCookies(details);
	}

	public async setAll(cookies: chrome.cookies.Cookie[], url: string): Promise<void> {
		for (const cookie of cookies) {
			const details: chrome.cookies.SetDetails = {
				url,
				name: cookie.name,
				value: cookie.value,
				domain: cookie.domain,
				path: cookie.path,
				secure: cookie.secure,
				httpOnly: cookie.httpOnly,
				expirationDate: cookie.expirationDate,
				storeId: cookie.storeId,
			};
			await setChromeCookies(details);
		}
		return Promise.resolve();
	}

	public async remove(details: chrome.cookies.Details) {
		return await removeChromeCookies(details);
	}

	public removeAll(url: string) {
		return getChromeCookies({ url })
				.then(async cookies => {
					for (const cookie of cookies) {
						await removeChromeCookies({ url, name: cookie.name });
					}
				});
	}
}
