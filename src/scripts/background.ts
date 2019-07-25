import BackgroundHost from '@/lib/BackgroundHost';
import AccountShare from '@/modules/background/accountShare';
import BlockConnection from '@/modules/background/blockConnection';
// import Giovanni from '@/modules/background/giovanni';
import '@/plugins/google-analytics';

new BackgroundHost({
	// Giovanni,
	BlockConnection,
	AccountShare,
});

chrome.runtime.onInstalled.addListener(details => {
	if (details.reason === 'install') {
		chrome.tabs.create({
			url: 'https://www.bilibili.com',
			selected: false,
		});
		chrome.tabs.create({
			url: `chrome-extension://${chrome.runtime.id}/options.html`,
			selected: true,
		});
	} else if (details.reason === 'update') {
		// 在没有升级(版本号不变)的情况下如果调用runtime.reload() details.reason也是'update'
		chrome.storage.local.get(null, items => {
			if (items.UpdateAvailable) {
				items.UpdateAvailable = false;
				chrome.storage.local.set(items, () => {
					chrome.tabs.create({
						url: `chrome-extension://${chrome.runtime.id}/options.html#/?catlog=true`,
						selected: true,
					});
				});
			}
		});
	}
});

chrome.runtime.onUpdateAvailable.addListener(details => {
	// 为了保证是真的升级才显示log，所以在onUpdateAvailable事件里添加一个新的数值
	chrome.storage.local.get(null, items => {
		items.UpdateAvailable = true;
		chrome.storage.local.set(items, () => {
			chrome.runtime.reload();
		});
	});
});
