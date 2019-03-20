import Module, { envContext, ModuleConstructor } from '@/lib/Module';
import ChromeAsyncStorage from '@/utils/chrome/storage';
import {
	parseCookie, serializeCookie,
} from '@/utils/helper';
import RegExpPattern from '@/utils/RegExpPattern';

const enum Direct {
	/* 账号导航栏 */
	watchHistory =             'x/v2/history',                                   // 观看历史
	newestFavList =            'x/v2/fav/video/newest',                          // 收藏夹
	stardustNewestFavList =          'medialist/gateway/coll/resource/recent',         // [星尘]收藏夹
	dynamicNew =               'dynamic_svr/v1/dynamic_svr/dynamic_new',         // 动态
	dynamicHistory =           'dynamic_svr/v1/dynamic_svr/dynamic_history',     // 动态 (往下翻页时)
	dynamicNum =               'dynamic_svr/v1/dynamic_svr/dynamic_num',         // 动态更新 提示你有多少个新动态
	historyToView =            'x/v2/history/toview/web',                        // 稍后再看
	messages =                 'web_im/v1/web_im/unread_msgs',                   // 消息
	messagesNotify =           'api/notify/query\\.notify\\.count\\.do',         // 应该是提醒你有没有人@你或者回复你的
	/* 弹幕 */
	danmakuPost =              'x/v2/dm/post',                                   // 发射弹幕
	danmakuReport =            'x/dm/report/add',                                // 举报弹幕
	danmakuRecall =            'x/dm/recall',                                    // 撤回弹幕
	/* 评论 */
	commentAdd =               'x/v2/reply/add',                                 // 添加评论
	commentDel =               'x/v2/reply/del',                                 // 删除评论
	commentAction =            'x/v2/reply/action',                              // 👍
	commentHate =              'x/v2/reply/hate',                                // 👎
	/* 操作 */
	relationStatus =           'x/relation',                                     // 关注的状态
	relationTag =              'x/relation/tags',                                // 关注分组
	relationModify =           'x/relation/modify',                              // 关注/黑名单
	subscriptPrompt =          'x/relation/prompt',                              // 收藏视频后提示是否关注
	liked =                    'x/web-interface/archive/has/like',               // 是否已经点赞了
	favoured =                 'x/v2/fav/video/favoured',                        // 是否已经收藏了
	favoriteFolder =           'x/v2/fav/folder',                                // 收藏夹列表
	favoriteAdd =              'x/v2/fav/video/add',                             // 添加收藏
	favoriteDel =              'x/v2/fav/video/del',                             // 删除收藏
	stardustFavorite =         'medialist/gateway/base/created',                 // [星尘]收藏
	stardustFavoriteDeal =     'medialist/gateway/coll/resource/deal',           // [星尘]添加到/删除收藏
	filter =                   'dm/filter/user',                                 // 同步/删除/添加屏蔽列表(包括屏蔽用户)
	threwCoin =                'x/web-interface/archive/coins',                  // 是否已经投过币
	throwCoin =                'x/web-interface/coin/add',                       // 投币
	tagging =                  'x/tag/archive/add',                              // 添加tag
	followBangumi =            'follow/web_api/season/follow',                   // 追番
	unfollowBangumi =          'follow/web_api/season/unfollow',                 // 取消追番
	triple =                   'x/web-interface/archive/like/triple',            // 三连
	shortReview =              'review/web_api/short/post',                      // 番剧短评
	videoLike =                'x/web-interface/archive/like',                   // 视频 👍/👎
	/* 其他 */
	heartbeat =                'x/report/web/heartbeat',                         // 记录播放时间之类的
	webshow =                  'x/web-show/res/locs',                            // 貌似是头部大图资讯
	fees =                     'cm/api/fees/pc',                                 // 不清楚
	feed =                     'ajax/feed/count',                                // 不清楚
	joybook =                  '[&?]?joybook=true',                              // joybook
	exp =                      'plus/account/exp.php',                           // 投币时的经验值
	charge =                   'x/web-interface/elec/show',                      // 充电鸣谢
	bangumiLastWatch =         'view/web_api/season/user/status',                // bangumi 最后观看时间
	stardustBangumiLastWatch = 'pgc/view/web/season/user/status',                // [星尘]bangumi 最后观看时间
	bangumiReview =            'review/web_api/user/open',                       // 番剧评测
	space =                    'space\\.bilibili\\.com',                         // 用户空间
}

export const config: ModuleConstructor = {
	name: 'AccountShare',
	context: envContext.background,
	priority: 1,
	storageOptions: {
		area: 'local',
		location: 'module.accountshare',
		switch: 'switch.accountshare',
		defaultSwitch: false,
	},
	setting: {
		title: '白嫖大会员',
		desc: '开启后，点击joybook扩展图标进行设置。',
		requireReload: true,
	},
};

export default class AccountShare extends Module {
	public storage: ChromeAsyncStorage;

	constructor() {
		super(config);
		this.storage = new ChromeAsyncStorage();
	}

	public launch() {
		this.storage.once('ready', () => {
			this.main();
			this.launchComplete();
		});
		this.storage.init();
	}

	public checkSwitch() {
		if (config.setting && config.storageOptions.switch && config.storageOptions.defaultSwitch) {
			return this.storage.get('local', config.storageOptions.switch, config.storageOptions.defaultSwitch);
		}
		return false;
	}

	public get storearea() {
		return this.storageOptions.area;
	}

	public get storelocation() {
		return this.storageOptions.location;
	}

	public main() {
		const { storage, storelocation, storearea } = this;
		chrome.webRequest.onBeforeSendHeaders.addListener(
			details => {
				// 白嫖打开但是没有获取账号cookies时
				if (!storage.get(storearea, `${storelocation}.account`)) return;
				const Referer = (<chrome.webRequest.HttpHeader[]> details.requestHeaders).filter(v => v.name === 'Referer');
				// 过滤网页地址
				if (Referer.length > 0 && !RegExpPattern.videoUrlPattern.test(<string> Referer[0].value)) {
					return;
				}

				// NOTE: 带有joybook的请求都加入Cookies
				if (/joybook/ig.test(details.url)) {
					const Cookies = storage.get<chrome.cookies.Cookie[]>(storearea, `${storelocation}.account.beneficiary.cookies`);
					let beneficiaryCookies = '';
					if (Cookies) {
						Cookies.forEach(cookie => {
							beneficiaryCookies += `${serializeCookie(cookie.name, cookie.value)}; `;
						});

						const originCookies = details.requestHeaders!.find(v => v.name === 'Cookie')!;
						if (originCookies) {
							const parsedCookies = parseCookie<any>(originCookies.value!);
							beneficiaryCookies += `${serializeCookie('stardustvideo', parsedCookies.stardustvideo)}; `;
							beneficiaryCookies += `${serializeCookie('stardustpgcv', parsedCookies.stardustpgcv)}; `;
							beneficiaryCookies += `${serializeCookie('CURRENT_FNVAL', parsedCookies.CURRENT_FNVAL)}`;
							beneficiaryCookies += `${serializeCookie('CURRENT_QUALITY', parsedCookies.CURRENT_QUALITY)}`;
						}

						details.requestHeaders = details.requestHeaders!.filter(v => !/cookie/i.test(v.name));

						details.requestHeaders!.push({
							name: 'Cookie',
							value: beneficiaryCookies,
						});
						return { requestHeaders: details.requestHeaders };
					}
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
				let modifyHeaders: chrome.webRequest.HttpHeader[] = [];
				if (details.requestHeaders!.filter(v => /cookie/i.test(v.name)).length > 0) {
					modifyHeaders = details.requestHeaders!.map(header => {
						if (header.name === 'Cookie') {
							const Cookies = storage.get<chrome.cookies.Cookie[]>(storearea, `${storelocation}.account.vip.cookies`);
							if (Cookies) {
								let vipCookies = '';
								Cookies.forEach(cookie => {
									vipCookies += `${serializeCookie(cookie.name, cookie.value)}; `;
								});

								const originCookies = details.requestHeaders!.find(v => v.name === 'Cookie')!;
								if (originCookies) {
									const parsedCookies = parseCookie<any>(originCookies.value!);
									vipCookies += `${serializeCookie('stardustvideo', parsedCookies.stardustvideo)}; `;
									vipCookies += `${serializeCookie('stardustpgcv', parsedCookies.stardustpgcv)}; `;
									vipCookies += `${serializeCookie('CURRENT_FNVAL', parsedCookies.CURRENT_FNVAL)}`;
									vipCookies += `${serializeCookie('CURRENT_QUALITY', parsedCookies.CURRENT_QUALITY)}`;
								}
								return {
									name: 'Cookie',
									value: vipCookies,
								};
							}
						}
						return header;
					});
				} else {
					const Cookies = storage.get<chrome.cookies.Cookie[]>(storearea, `${storelocation}.account.vip.cookies`);
					if (Cookies) {
						let vipCookies = '';
						Cookies.forEach(cookie => {
							vipCookies += `${serializeCookie(cookie.name, cookie.value)}; `;
						});

						const originCookies = details.requestHeaders!.find(v => v.name === 'Cookie')!;
						if (originCookies) {
							const parsedCookies = parseCookie<any>(originCookies.value!);
							vipCookies += `${serializeCookie('stardustvideo', parsedCookies.stardustvideo)}; `;
							vipCookies += `${serializeCookie('stardustpgcv', parsedCookies.stardustpgcv)}; `;
							vipCookies += `${serializeCookie('CURRENT_FNVAL', parsedCookies.CURRENT_FNVAL)}`;
							vipCookies += `${serializeCookie('CURRENT_QUALITY', parsedCookies.CURRENT_QUALITY)}`;
						}

						modifyHeaders = details.requestHeaders!;
						modifyHeaders.push({ name: 'Cookie', value: vipCookies });
					}
				}
				return {
					requestHeaders: modifyHeaders,
				};
			},
			{ urls: [
					'*://*.bilibili.com/*',
				],
			},
			['blocking', 'requestHeaders', 'extraHeaders'],
		);
	}
}
