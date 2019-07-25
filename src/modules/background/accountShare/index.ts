import BackgroundModule from '@/lib/BackgroundModule';
import { parseCookie, serializeCookie } from '@/utils/helper';
import RegExpPattern from '@/utils/RegExpPattern';
import config, { Direct } from './config';

export default class AccountShare extends BackgroundModule {
	private syncPage: HTMLIFrameElement;
	private syncPort: chrome.runtime.Port = null as any;
	private remotePort: chrome.runtime.Port = null as any;
	private syncResponseCollect: Record<string, string> = {};

	constructor() {
		super(config as typeof config);

		const page = document.createElement('iframe');
		// page.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms');
		page.referrerPolicy = 'no-referrer';
		document.body.appendChild(page);
		this.syncPage = page;
	}

	public launch() {
		this.addEventListener('remoteMessage', this.syncOpenPage);
		this.addEventListener('remoteConnect', ({ port }) => {
			if (port.name === 'sync:connect') {
				this.syncPort = port;
				this.syncPort.onMessage.addListener(message => {
					this.syncResponseCollect[message.payload.url] = message.payload.responseText;
				});
			}
			if (port.name === 'sync:pluginAttach') {
				this.remotePort = port;
				this.remotePort.onMessage.addListener(this.onRemoteMessage);
			}
		});
		// this.main();
		return Promise.resolve();
	}

	public onRemoteMessage = () => {

	}

	public syncOpenPage = ({ tabId, message }: joybook.BackgroundHost.RemoteMessage) => {
		if (!/^sync:.+/i.test(message.postName)) return;
		const action = message.postName.split(':')[1];.
		switch (action) {
			case 'playurl':
				chrome.tabs.get(tabId, tab => {
					this.syncPage.src = tab.url!;
				});
				break;
			case 'heartbeat':
				this.syncPort.postMessage({
					postName: 'sync:heartbeat',
					payload: message.payload,
				});
			default: break;
		}
	}

	public modifyHeaderCookie(requestHeaders: chrome.webRequest.HttpHeader[], cookies: chrome.cookies.Cookie[]) {
		const originCookies = requestHeaders.find(header => header.name === 'Cookie');
		let serializeCookies = '';
		cookies.forEach(cookie => {
			if (/(dedeuser.+)|(sessdata)|(bili_jct)|(sid)|(buvid3)|(live_buvid)/i.test(cookie.name)) {
				serializeCookies += `${serializeCookie(cookie.name, cookie.value)}; `;
			}
		});

		if (originCookies) {
			const parsedCookies = parseCookie<any>(originCookies.value!);
			parsedCookies.stardustvideo && (serializeCookies += `${serializeCookie('stardustvideo', parsedCookies.stardustvideo)}; `);
			parsedCookies.stardustpgcv && (serializeCookies += `${serializeCookie('stardustpgcv', parsedCookies.stardustpgcv)}; `);
			parsedCookies.CURRENT_FNVAL && (serializeCookies += `${serializeCookie('CURRENT_FNVAL', parsedCookies.CURRENT_FNVAL)}`);
			parsedCookies.CURRENT_QUALITY && (serializeCookies += `${serializeCookie('CURRENT_QUALITY', parsedCookies.CURRENT_QUALITY)}`);
		}

		if (requestHeaders.find(header => header.name === 'Cookie')) {
			const mHeaders = requestHeaders.map(header => {
				if (header.name === 'Cookie') {
					// return { name: 'Cookie', value: '' };
					return {
						name: 'Cookie',
						value: serializeCookies,
					};
				}
				return header;
			});
			console.log(mHeaders);
			return mHeaders;
		} else {
			requestHeaders.push({
				name: 'Cookie',
				value: serializeCookies,
			});
			return requestHeaders;
		}
	}

	public main() {
		const { storage } = this;
		const storearea = this.storageOptions.area;
		const vipCookies = this.storage.get<chrome.cookies.Cookie[]>(this.storageOptions.area, `module.${this.name}.database.account.vip.cookies`);
		const Cookies = this.storage.get<chrome.cookies.Cookie[]>(this.storageOptions.area, `module.${this.name}.database.account.beneficiary.cookies`);

		chrome.webRequest.onBeforeSendHeaders.addListener(
			details => {
				console.log(details);
				// 白嫖打开但是没有获取账号cookies时
				if (this.disposed || !storage.get(storearea, `module.${this.name}.database.account`)) return;
				const Referer = (<chrome.webRequest.HttpHeader[]> details.requestHeaders).filter(v => v.name === 'Referer');
				// 过滤网页地址
				if (Referer.length > 0 && !RegExpPattern.videoUrlPattern.test(<string> Referer[0].value)) {
					return;
				}

				// NOTE: 带有joybook的请求都加入Cookies
				if (/joybook/ig.test(details.url)) {
					const requestHeaders = this.modifyHeaderCookie(details.requestHeaders!, Cookies);
					return { requestHeaders };
				}

				// 过滤连接
				if (
					new RegExp(Direct.watchHistory, 'ig').test(details.url) ||
					new RegExp(Direct.heartbeat, 'ig').test(details.url) ||
					new RegExp(Direct.webshow, 'ig').test(details.url) ||
					new RegExp(Direct.newestFavList, 'ig').test(details.url) ||
					new RegExp(Direct.stardustNewestFavList, 'ig').test(details.url) ||
					new RegExp(Direct.dynamicHistory, 'ig').test(details.url) ||
					new RegExp(Direct.dynamicNew, 'ig').test(details.url) ||
					new RegExp(Direct.dynamicNum, 'ig').test(details.url) ||
					new RegExp(Direct.historyToView, 'ig').test(details.url) ||
					new RegExp(Direct.messages, 'ig').test(details.url) ||
					new RegExp(Direct.messagesNotify, 'ig').test(details.url) ||

					new RegExp(Direct.danmakuPost, 'ig').test(details.url) ||
					new RegExp(Direct.danmakuReport, 'ig').test(details.url) ||
					new RegExp(Direct.danmakuRecall, 'ig').test(details.url) ||

					new RegExp(Direct.commentAdd, 'ig').test(details.url) ||
					new RegExp(Direct.commentDel, 'ig').test(details.url) ||
					new RegExp(Direct.commentAction, 'ig').test(details.url) ||
					new RegExp(Direct.commentHate, 'ig').test(details.url) ||
					new RegExp(Direct.commentReport, 'ig').test(details.url) ||

					new RegExp(Direct.relationStatus, 'ig').test(details.url) ||
					new RegExp(Direct.relationTag, 'ig').test(details.url) ||
					new RegExp(Direct.relationModify, 'ig').test(details.url) ||
					new RegExp(Direct.subscriptPrompt, 'ig').test(details.url) ||
					new RegExp(Direct.liked, 'ig').test(details.url) ||
					new RegExp(Direct.favoured, 'ig').test(details.url) ||
					new RegExp(Direct.favoriteFolder, 'ig').test(details.url) ||
					new RegExp(Direct.favoriteAdd, 'ig').test(details.url) ||
					new RegExp(Direct.favoriteDel, 'ig').test(details.url) ||
					new RegExp(Direct.stardustFavorite, 'ig').test(details.url) ||
					new RegExp(Direct.stardustFavoriteDeal, 'ig').test(details.url) ||
					new RegExp(Direct.filter, 'ig').test(details.url) ||
					new RegExp(Direct.threwCoin, 'ig').test(details.url) ||
					new RegExp(Direct.throwCoin, 'ig').test(details.url) ||
					new RegExp(Direct.tagging, 'ig').test(details.url) ||
					new RegExp(Direct.followBangumi, 'ig').test(details.url) ||
					new RegExp(Direct.unfollowBangumi, 'ig').test(details.url) ||
					new RegExp(Direct.triple, 'ig').test(details.url) ||
					new RegExp(Direct.shortReview, 'ig').test(details.url) ||
					new RegExp(Direct.videoLike, 'ig').test(details.url) ||

					new RegExp(Direct.fees, 'ig').test(details.url) ||
					new RegExp(Direct.feed, 'ig').test(details.url) ||
					new RegExp(Direct.exp, 'ig').test(details.url) ||
					new RegExp(Direct.bangumiLastWatch, 'ig').test(details.url) ||
					new RegExp(Direct.stardustBangumiLastWatch, 'ig').test(details.url) ||
					new RegExp(Direct.bangumiReview, 'ig').test(details.url) ||
					new RegExp(Direct.space, 'ig').test(details.url) ||

					new RegExp(Direct.joybook).test(details.url)
				) {
					return;
				}
				return {
					requestHeaders: this.modifyHeaderCookie(details.requestHeaders!, Cookies),
				};
			},
			{ urls: [
					'*://*.bilibili.com/*',
					// '<all_urls>',
				],
			},
			['blocking', 'requestHeaders', 'extraHeaders'],
		);
	}
}
