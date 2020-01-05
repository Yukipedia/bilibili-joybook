import BackgroundModule from '@/lib/BackgroundModule';
import ChromeAsyncCookies from '@/utils/chrome/cookies';

export default class VIP extends BackgroundModule {
	public cookies: ChromeAsyncCookies = new ChromeAsyncCookies({ url: 'https://www.bilibili.com' });

	constructor() {
		super({
			name: 'VIP',
		});
	}

	public launch() {
		const vipCookies = this.storage.get<chrome.cookies.Cookie[]>('local', `module.AccountShare.database.account.vip.cookies`);
		const url = 'https://www.bilibili.com';

		this.addEventListener('remoteMessage', ({ tabId, message }) => {
			console.log(vipCookies);
			if (message.postName == 'isVIP') {
				const removeAllCookies = () => {
					return new Promise((resolve) => {
						chrome.cookies.getAll({
							url: url
						}, cookies => {
							cookies.forEach(cookie => {
								chrome.cookies.remove({
									url: url,
									name: cookie.name,
								});
							})
							console.log('removeAllCookies');
							return resolve();
						});
					})
				}

				const setVIPCookies = async () => {
					await removeAllCookies().then(() => {
						vipCookies.forEach(cookie => {
							chrome.cookies.set({
								url: url,
								name: cookie.name,
								value: cookie.value,
								domain: cookie.domain,
								path: cookie.path,
								secure: cookie.secure,
								httpOnly: cookie.httpOnly,
								expirationDate: cookie.expirationDate,
								storeId: cookie.storeId,
							})
						});
						console.log('setVIPCookies');
						chrome.tabs.reload(tabId);
					})
				}

				setVIPCookies();
			}
		});
	}
}
