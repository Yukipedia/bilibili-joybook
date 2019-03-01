import Module from '@/lib/Module';
import { waitUntilDomLoaded } from '@/utils/helper';
import RegExpPattern from '@/utils/RegExpPattern';
import config, { RID } from './config';

import openBtn from './UI/openBtn.vue';

export default class AVBlocker extends Module {
	public blocklist: joybook.avblocker.FullBlockList;

	constructor() {
		super(config);
		this.blocklist = null as any;
	}

	public launch(moduleNsp) {
		this.main(moduleNsp);
		waitUntilDomLoaded('[data-app]', false)
			.then(() => {
				this.insertInterface();
			});
		this.launchComplete();
	}

	// dynamic/region -> dynamic/region?ps=50 -> filter -> return filtered data
	//                      ↑    looping filter    ↓
	//                      ------------------------
	public main(moduleNsp) {
		moduleNsp.MXHRR.addAjaxJob((param, oriResultTransformer) => {
			if (param.url.match(RegExpPattern.dynamicRegion)) {
				return this.filterOutRegionDynamic(param, oriResultTransformer);
			} else if (param.url.match(RegExpPattern.rankingRegion)) {
				return this.filterOutRegionRanking(param, oriResultTransformer);
			}
			return;
		});
	}

	public insertInterface() {
		for (const i in RID) {
			new openBtn({
				propsData: {
					section: i,
				},
			}).$mount();
		}
	}

	private validValue(regexp: string[], value: any) {
		if (!value) return false;
		for (const reg of regexp) {
			if (typeof reg === 'string') {
				const result = this.escapeRegexp(reg);

				// 如果不是 /./ig 这种形式 则直接尝试匹配
				if ((!result) && new RegExp(reg).test(value)) {
					return true;
				} else if (result && new RegExp(result.exp, result.flags).test(value)) {
					return true;
				}
			}
		}
		return false;
	}

	private escapeRegexp(text: string) {
		const firstslash = text.indexOf('/');
		const lastslash = text.lastIndexOf('/');
		const flags = text.substring(lastslash + 1);

		// /[a-z]+/i
		// ↑      ↑
		// ===0 !==1
		if (firstslash === 0 && lastslash > 1) {
			return { exp: text.substring(firstslash + 1, lastslash), flags };
		}
		return false;
	}

	private getBlocklist(rid: number): Promise<joybook.avblocker.BlockList> {
		rid = Number(rid);
		return new Promise(resolve => {
			function returnBlocklist(blocklist: joybook.avblocker.FullBlockList) {
				for (const key of Object.keys(RID)) {
					if (RID[key] === rid) {
						const list: joybook.avblocker.SectionBlockList = blocklist[key];
						if (!list) return resolve(blocklist.global);
						if (list && list.merge) {
							return resolve({
								aid: list.aid.concat(blocklist.global.aid),
								cid: list.cid.concat(blocklist.global.cid),
								copyright: list.copyright.concat(blocklist.global.copyright),
								desc: list.desc.concat(blocklist.global.desc),
								owner: list.owner.concat(blocklist.global.owner),
								stat: list.stat,
								title: list.title.concat(blocklist.global.title),
								tname: list.tname.concat(blocklist.global.tname),
								videos: list.videos,
							});
						}
						return resolve(list);
					}
				}

				// 没有匹配到对应的屏蔽列表时返回全局列表
				return resolve(blocklist.global);
			}

			if (this.blocklist) return returnBlocklist(this.blocklist);
			chrome.runtime.sendMessage(window.joybook.id, {
				name: 'serve',
				cmd: 'get:storage',
				payload: [this.storageOptions.area, this.storageOptions.location],
			}, (response: joybook.avblocker.FullBlockList) => {
				this.blocklist = response;
				return returnBlocklist(this.blocklist);
			});
		});
	}

	private filter<T>(
		originalArchives: T[],
		archives: joybook.avblocker.Archive[],
		blocklist: joybook.avblocker.BlockList,
	) {
		return new Promise<T[]>((resolve, reject) => {
			const tick = (archive): Promise<boolean> => {
				return new Promise(resolve => {
					const { aid, cid, copyright, desc, owner, stat, title, tname, videos } = blocklist;

					for (const key in blocklist) {
						switch (key) {
							case 'aid':
								if (aid.includes(archive.aid)) return resolve(false);
								break;
							case 'cid':
								if (cid.includes(archive.cid)) return resolve(false);
								break;
							case 'copyright':
								if (copyright.includes(archive.copyright)) return resolve(false);
								break;
							case 'desc':
								if (this.validValue(desc, archive.desc)) return resolve(false);
								break;
							case 'owner':
								if (owner.includes(archive.owner)) return resolve(false);
								break;
							case 'stat':
								const { coin, danmaku, dislike, favorite, like, view } = stat;
								// 根据硬币判断
								if (typeof coin !== 'boolean') {
									if (coin.min && archive.stat.coin > coin.min) return resolve(false);
									if (coin.max && archive.stat.coin < coin.max) return resolve(false);
								}
								if (typeof danmaku !== 'boolean') {
									if (danmaku.min && archive.stat.danmaku > danmaku.min) return resolve(false);
									if (danmaku.max && archive.stat.danmaku < danmaku.max) return resolve(false);
								}
								if (typeof dislike !== 'boolean') {
									if (dislike.min && archive.stat.dislike > dislike.min) return resolve(false);
									if (dislike.max && archive.stat.dislike < dislike.max) return resolve(false);
								}
								if (typeof favorite !== 'boolean') {
									if (favorite.min && archive.stat.favorite > favorite.min) return resolve(false);
									if (favorite.max && archive.stat.favorite < favorite.max) return resolve(false);
								}
								if (typeof like !== 'boolean') {
									if (like.min && archive.stat.like > like.min) return resolve(false);
									if (like.max && archive.stat.like < like.max) return resolve(false);
								}
								if (typeof view !== 'boolean') {
									if (view.min && archive.stat.view > view.min) return resolve(false);
									if (view.max && archive.stat.view < view.max) return resolve(false);
								}
								break;
							case 'title':
								if (this.validValue(title, archive.title)) return resolve(false);
								break;
							case 'tname':
								if (this.validValue(tname, archive.tname)) return resolve(false);
								break;
							case 'videos':
								if (typeof videos !== 'boolean') {
									if (videos.max && archive.videos < videos.max) return resolve(false);
									if (videos.min && archive.videos > videos.min) return resolve(false);
								}
								break;
							default:
								break;
						}
					}
					return resolve(true);
				});
			};

			Promise.all([...archives.map(v => tick(v))])
				.then(result => {
					return resolve(
						(<any[]> result)
							.map((v, i) => v === true ? originalArchives[i] : v)
							.filter(v => typeof v !== 'boolean'),
					);
				})
				.catch(e => reject(e));
		});
	}

	private filterOutRegionDynamic(param, oriResultTransformer) {
		oriResultTransformer = p => p
			.then((json: bili.DynamicRegion) => {
				return this.getBlocklist(param.data.rid)
					.then(blocklist => {
						return new Promise<bili.DynamicRegionArchive[]>((resolve, reject) => {
							let archives = json.data.archives;
							let retryCount = 0;
							let filted: bili.DynamicRegionArchive[] = [];
							const walk = () => {
								const filterArchives = archives.map(archive => {
									return {
										aid: archive.aid,
										cid: archive.cid,
										copyright: archive.copyright,
										desc: archive.desc,
										owner: archive.owner.mid,
										stat: {
											coin: archive.stat.coin,
											danmaku: archive.stat.danmaku,
											dislike: archive.stat.dislike,
											favorite: archive.stat.favorite,
											like: archive.stat.like,
											view: archive.stat.view,
										},
										title: archive.title,
										tname: archive.tname || archive.typename,
										videos: archive.videos,
									} as joybook.avblocker.Archive;
								});

								this.filter<bili.DynamicRegionArchive>(archives, filterArchives, blocklist)
									.then(result => {
										result = result.filter(v => !filted.map(v => v.aid).includes(v.aid));

										filted = filted.concat(result);
										if (filted.length >= json.data.archives.length) return resolve(filted);

										if (retryCount >= 15) {
											return reject({
												code: 1,
												message: `重试次数达到${retryCount}次，停止重试。过滤过的av会和没有过滤过的原始数据合并。`,
												data: filted.concat(archives),
											});
										}
										this.axios
											.get(`${param.url}?rid=${param.data.rid}&ps=50`)
											.then(response => response.data)
											.then((result: bili.DynamicRegion) => {
												if (result.code !== 0) {
													return reject(
														{
															code: -8888,
															message: `服务器返回错误`,
															data: archives,
														},
													);
												}
												archives = result.data.archives;
												retryCount += 1;
												requestAnimationFrame(walk);
											})
											.catch(e => {
												return reject({
													code: -8888,
													message: e,
													data: archives,
												});
											});
									});
							};
							walk();
						});
					})
					.then(result => {
						json.data.archives = result;
						return json;
					})
					.catch(e => {
						joybook.error(e.message);
						json.data.archives = e.data;
						return json;
					});
			});
		return oriResultTransformer;
	}

	private filterOutRegionRanking(param, oriResultTransformer) {
		oriResultTransformer = p => p
			.then((json: bili.RankingRegion) => {
				// FIXME: 广告数据不知道怎么获取，嗦以不管它。
				if (param.data.rid === '165') return json;
				return this.getBlocklist(param.data.rid)
					.then(blocklist => {
						console.log(blocklist);
						return new Promise<bili.RankingRegionArchive[]>((resolve, reject) => {
							let archives = json.data;
							let retryCount = 0;
							let filted: bili.RankingRegionArchive[] = [];

							const walk = () => {
								const filterArchives = archives.map(archive => {
									return {
										aid: Number(archive.aid),
										cid: undefined,
										copyright: undefined,
										desc: undefined,
										owner: Number(archive.mid),
										stat: {
											coin: undefined,
											danmaku: undefined,
											dislike: undefined,
											favorite: undefined,
											like: undefined,
											view: Number(archive.play),
										},
										title: archive.title,
										tname: undefined,
										videos: undefined,
									} as joybook.avblocker.Archive;
								});

								this.filter<bili.RankingRegionArchive>(archives, filterArchives, blocklist)
									.then(result => {
										result = result.filter(v => !filted.map(v => Number(v.aid)).includes(Number(v.aid)));

										filted = filted.concat(result);

										if (filted.length >= json.data.length) return resolve(filted);
										if (retryCount > 0) return resolve(filted.concat(archives));

										chrome.runtime.sendMessage(
											window.joybook.id,
											{
												name: 'serve:getRankingRegionData',
												options: {
													rid: param.data.rid,
													day: param.data.day,
													origin: Number(param.original),
												},
											},
											response => {
												if (!response && chrome.runtime.lastError) {
													reject(chrome.runtime.lastError);
													chrome.runtime.lastError = undefined;
													return;
												}
												archives = JSON.parse(response);
												retryCount += 1;
												requestAnimationFrame(walk);
											},
										);
									});
							};
							walk();
						});
					})
					.then(result => {
						return new Promise((resolve, reject) => {
							const P = result
								.sort((a, b) => Number(b.pts) - Number(a.pts))
								// 只需要跟原数据量一样大就行
								.splice(0, json.data.length)
								.map(archive => {
									// 如果archive不似我们收集的数据就直接返回
									if (archive.pic) return Promise.resolve(archive);
									// 如果似，那就获取详细数据
									return this.axios.get(`https://api.bilibili.com/x/web-interface/view?aid=${archive.aid}`)
										.then(respnse => respnse.data)
										.then((response: bili.ViewData) => {
											const data = response.data;
											const ctime = new Date(data.ctime * 1000).toLocaleString(undefined, { hour12: false });
											return {
												aid: `${data.aid}`,
												author: data.owner.name,
												badgepay: false,
												coins: data.stat.coin,
												create: ctime.replace(/\//g, '-').substring(0, ctime.lastIndexOf(':')),
												description: data.desc,
												duration: `${Math.floor(data.duration / 60)}:${Math.floor(data.duration % 60)}`,
												favorites: data.stat.favorite,
												mid: data.owner.mid,
												pic: data.pic,
												play: data.stat.view,
												pts: archive.pts,
												review: 0,
												rights: data.rights,
												subtitle: '',
												title: data.title,
												typename: data.tname || data.typename,
												video_review: data.stat.danmaku,
											} as bili.RankingRegionArchive;
										})
										.then(data => Promise.resolve(data))
										.catch(e => {
											joybook.error('获取rankav详情失败->', e);
											return Promise.resolve(archive);
										});
								});

							Promise.all(P)
								.then(result => {
									json.data = result;
									return resolve(json);
								})
								.catch(e => reject(e));
						});
					})
					.catch(e => {
						joybook.error(e);
						e.data && (json.data = e.data);
						return json;
					});
			});
		return oriResultTransformer;
	}
}
