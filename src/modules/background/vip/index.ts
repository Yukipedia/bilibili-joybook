import BackgroundModule from '@/lib/BackgroundModule';

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
export default class VIP extends BackgroundModule {
	constructor() {
		super({
			name: 'VIP',
		});
	}

	public launch() {
		const vipCookies = this.storage.get<chrome.cookies.Cookie[]>('local', 'module.AccountShare.database.account.vip.cookies');
		const userCookies = this.storage.get<chrome.cookies.Cookie[]>('local', 'module.AccountShare.database.account.beneficiary.cookies');
		const url = 'https://www.bilibili.com';
		let reloadTimes = 0;

		if (!(vipCookies && userCookies)) {
			console.log('不使用脚本还想白嫖？')
			return;
		}

		this.addEventListener('remoteMessage', async ({ tabId, message }) => {
			console.log(message);
			if (message.postName === 'isVIP') {
				await this.removeAllCookies(url).then(() => {
					this.setAllCookies(vipCookies, url);
				})
				console.log('setVIPCookies');
				//太快了不知道怎么阻止reload（）
				if (reloadTimes < 2) {
					reloadTimes++;
					await this.reload(tabId);
				}
				await this.removeAllCookies(url).then(() => {
					this.setAllCookies(userCookies, url);
				});
				console.log('setUserCookies');
			}
		});
	}

	public reload(tabId: number) {
		return new Promise(resolve => {
			chrome.tabs.reload(tabId);
			console.log('reload');
			return resolve();
		})
	}

	public async removeAllCookies(url: string) {
		const cookies = await getChromeCookies({ url });
		cookies.forEach(async (cookie) => {
			await removeChromeCookies({ url, name: cookie.name });
		});
		console.log('removeAllCookies');
	}

	public setAllCookies(cookies: chrome.cookies.Cookie[], url: string) {
		cookies.forEach(async (cookie) => {
			await setChromeCookies({
				url,
				name: cookie.name,
				value: cookie.value,
				domain: cookie.domain,
				path: cookie.path,
				secure: cookie.secure,
				httpOnly: cookie.httpOnly,
				expirationDate: cookie.expirationDate,
				storeId: cookie.storeId,
			});
		});
	}
}
