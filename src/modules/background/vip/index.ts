import BackgroundModule from '@/lib/BackgroundModule';
import { removeAll, setAll } from '@/utils/chrome/new_cookies';
import { reload } from '@/utils/chrome/new_tabs';
import { sleep } from '@/utils/helper';

export default class VIP extends BackgroundModule {
	constructor() {
		super({
			name: 'VIP',
		});
	}

	public launch() {
		const vipCookies = this.storage.get<chrome.cookies.Cookie[]>('local', 'module.AccountShare.database.account.vip.cookies');
		const userCookies = this.storage.get<chrome.cookies.Cookie[]>('local', 'module.AccountShare.database.account.beneficiary.cookies');
		const biliUrl = 'https://www.bilibili.com';

		if (!(vipCookies && userCookies)) {
			return;
		}

		this.addEventListener('remoteMessage', ({ tabId, message }) => {
			if (message.postName === 'vip:requireVIPAccount') {
				removeAll(biliUrl)
					.then(() => setAll(vipCookies, biliUrl))
					.then(() => reload(tabId))
					.then(() => sleep(0.3))
					.then(() => removeAll(biliUrl))
					.then(() => setAll(userCookies, biliUrl));
			}
		});
	}
}
