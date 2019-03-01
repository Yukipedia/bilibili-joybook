import Module, { envContext } from '@/lib/Module';
import ChromeAsyncCookies from '@/utils/chrome/cookies';
import ChromeAsyncStorage from '@/utils/chrome/storage';
import ChromeAsyncTabs from '@/utils/chrome/tabs';

export default class Serve extends Module {
	private storage: ChromeAsyncStorage;
	private tabs: ChromeAsyncTabs;

	private collectName: string;
	private collectFinish: boolean;
	private collectRunning: boolean;

	constructor() {
		super({
			name: 'Serve',
			context: envContext.background,
			priority: 9,
		});
		this.storage = new ChromeAsyncStorage();
		this.tabs = new ChromeAsyncTabs();

		this.collectName = '';
		this.collectFinish = false;
		this.collectRunning = false;
	}

	public launch() {
		this.storage.once('ready', () => {
			this.main();
			this.launchComplete();
		});
		this.storage.init();
	}

	public async main() {
		chrome.runtime.onMessageExternal.addListener(this.handleMessage.bind(this));
		chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
		// chrome.webRequest.onBeforeSendHeaders.addListener(this.handleRequest.bind(this));


		// TODO: 完成使用B站黑名单的功能
		// const blocklist = document.createElement('iframe');
		// blocklist.src = 'https://account.bilibili.com/account/blacklist';
		// blocklist.id = 'test';

		// document.body.appendChild(blocklist);

		const lastCollectTime = Number(localStorage.getItem('lastCollectTime'));
		if (lastCollectTime) {
			if (Date.now() - lastCollectTime >= 1200000) {
				await this.collectRankingRegionData();
				setInterval(() => this.collectRankingRegionData(), 1200000);
			} else {
				// 如果有最后收集时间 但是时间不大于20分钟
				setTimeout(() => {
					this.collectRankingRegionData().then(() => setInterval(() => this.collectRankingRegionData(), 1200000));
				}, 1200000 - (Date.now() - lastCollectTime));
			}
		} else if (!lastCollectTime) {
			await this.collectRankingRegionData();
			setInterval(() => this.collectRankingRegionData(), 1200000);
		}
	}

	private async collectRankingRegionData() {
		this.collectName = '';
		this.collectFinish = false;
		this.collectRunning = true;

		const datapage = document.createElement('iframe');
		// @ts-ignore
		datapage.sandbox = '';
		document.body.appendChild(datapage);

		const RID = [1, 168, 3, 129, 4, 36, 188, 160, 119, 155, 5, 181, 177, 23, 11];
		const TYPE = ['all', 'origin'];
		const DAY = [3, 7];

		const next = () => {
			return new Promise(resolve => {
				const walk = () => {
					if (this.collectFinish) {
						this.collectFinish = false;
						return resolve();
					} else setTimeout(walk, 100);
				};
				walk();
			});
		};

		for (const rid of RID) {
			for (const type of TYPE) {
				for (const day of DAY) {
					if ([177, 23, 11].includes(rid)) {
						// 因为cinema没有原创和全部的分别 这三个 每个都会运行多两次
						// 如果type为原创时忽略执行
						if (type === 'origin') continue;
						datapage.src = `https://www.bilibili.com/ranking/cinema/${rid}/1/${day}`;
						this.collectName = `cinema_${rid}_1_${day}`;
					} else {
						datapage.src = `https://www.bilibili.com/ranking/${type}/${rid}/1/${day}`;
						this.collectName = `${type}_${rid}_1_${day}`;
					}

					console.log(datapage.src);
					await next();
				}
			}
		}

		datapage.remove();
		this.collectRunning = false;
		localStorage.setItem('lastCollectTime', `${Date.now()}`);
		console.log('collecting finished.');
	}

	private async asyncSendResponse(sendResponse: (response: any) => void, message: any) {
		const method = message.cmd.split(':')[0];
		const module = message.cmd.split(':')[1];
		const args = message.payload;

		try {
			const result = await this[module][method](...args);
			return sendResponse(result);
		} catch (e) {
			return sendResponse(new Error(e));
		}
	}

	private getRankingData(options: { rid: bili.RID; day: 3 | 7; origin: boolean; }) {
		const rankingData = localStorage.getItem(`${[177, 23, 11].includes(options.rid) ? 'cinema' : (origin ? 'origin' : 'all')}_${options.rid}_1_${options.day}`);
		return rankingData;
	}

	private handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
		console.log(message);
		if (message.name === 'serve') {
			this.asyncSendResponse(sendResponse, message);
			// https://developer.chrome.com/extensions/runtime#event-onMessage
			// return true from the event listener to indicate you wish to send a response asynchronously.
			// (this will keep the message channel open to the other end until sendResponse is called)
			return true;
		} else if (message.name === 'serve:collectRankingRegionDataNext') {
			if (this.collectRunning === true) {
				localStorage.setItem(this.collectName, JSON.stringify(message.currentData));
				this.collectFinish = true;
			}
			return;
		} else if (message.name === 'serve:getRankingRegionData') {
			return sendResponse(this.getRankingData(message.options));
		}
		return true;
	}
}
