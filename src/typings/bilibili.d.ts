declare namespace bili {
	enum RID {
		'动画' = 1,
		'番剧' = 13,
		'国创' = 168,
		'音乐' = 3,
		'舞蹈' = 129,
		'游戏' = 4,
		'科技' = 36,
		'数码'= 188 ,
		'生活' = 160,
		'鬼畜' = 119,
		'时尚' = 155,
		'广告' = 165,
		'娱乐' = 5,
		'电影' = 23,
		'TV剧' = 11,
		'影视' = 181,
		'纪录片' = 177,
	}

	enum ajaxIndexSettings {
		'直播' = 0,
		'动画' = 1,
		'番剧' = 2,
		'国创' = 3,
		'音乐' = 4,
		'舞蹈' = 5,
		'游戏' = 6,
		'科技' = 7,
		'数码' = 8,
		'生活' = 9,
		'鬼畜' = 10,
		'时尚' = 11,
		'广告' = 12,
		'娱乐' = 13,
		'电影' = 14,
		'TV剧' = 15,
		'影视' = 16,
		'纪录片' = 17,
	}

	interface BaseResponse {
		code: number;
		ttl?: boolean;
		message?: string;
	}

	interface NavData {
		code: number;
		data: {
			allowance_count: number;
			email_verified: boolean;
			face: string;
			has_shop: boolean;
			isLogin: boolean;
			level_info: {
				current_exp: number;
				current_level: number;
				current_min: number;
				next_exp: number;
			};
			mid: number;
			mobile_verified: boolean;
			// 硬币
			money: number;
			// 节操值
			moral: number
			officialVerify: {
				type: number;
				desc: string;
			};
			pendant: {
				pid: 0;
				name: string;
				image: string;
				expire: number;
			};
			scores: number;
			shop_url: string;
			uname: string;
			vipDueDate: number;
			vipStatus: number;
			vipType: number;
			vip_pay_type: number;
			wallet: {
				mid: number,
				bcoin_balance: number;
				coupon_balance: number;
				coupon_due_time: number;
			}
		};
		message: string;
		ttl: number;
	}

	interface DynamicRegionArchive {
		// avid 番剧也有!
		aid: number;
		attribute: number;
		cid: number;
		copyright: number;
		// 创建时间 timestamp 单位：秒
		ctime: number;
		// 视频简介
		desc: string;
		dimension: {
			width: number;
			height: number;
			rotate: number;
		};
		// 视频长度 单位：秒
		duration: number;
		dynamic: string;
		owner: {
			face: string;
			mid: number;
			name: string;
		};
		// 封面
		pic: string;
		// 发布时间 timestamp 单位：秒
		pubdate: number;
		// 视频权限
		rights: {
			autoplay: boolean;
			bp: boolean;
			download: boolean;
			elec: boolean;
			hd5: boolean;
			movie: boolean;
			no_reprint: boolean;
			pay: boolean;
			ugc_pay: boolean;
		};
		// 状态
		stat: {
			aid: number;
			coin: number;
			danmaku: number;
			dislike: number;
			favorite: number;
			// 未上榜为0
			his_rank: number;
			like: number;
			now_rank: number;
			reply: number;
			share: number;
			view: number;
		};
		state: number;
		tid: number;
		title: string;
		tname?: string;
		typename?: string;
		// 分P数
		videos: number;
	}

	interface DynamicRegion extends BaseResponse {
		message: string;
		data: {
			archives: DynamicRegionArchive[];
			page: {
				count: number;
				num: number;
				size: number;
			}
		};
	}

	// blocklist
	interface Blacklist extends BaseResponse {
		data: {
			list: Array<{
				mid: number;
				attribute: number;
				mtime: number;
				tag: string;
				special: number;
				uname: string;
				face: string;
				sign: string;
				official_verify: {
					type: number;
					desc: string;
				},
				vip: {
					vipType: number;
					vipDueDate: number;
					dueRemark: string;
					accessStatus: number;
					vipStatus: number;
					vipStatusWarn: string;
				}
			}>;
			re_version: number;
			total: number;
		};
	}

	interface RankingRegionArchive {
		aid: string;
		author: string;
		badgepay: boolean;
		coins: number;
		create: string;
		description: string;
		duration: string;
		favorites: number;
		mid: number;
		pic: string;
		play: number;
		pts: number;
		review: number;
		rights: {
			autoplay: boolean;
			bp: boolean;
			download: boolean;
			elec: boolean;
			hd5: boolean;
			is_cooperation: boolean;
			movie: boolean;
			no_reprint: boolean;
			pay: boolean;
			ugc_pay: boolean;
		};
		subtitle: string;
		title: string;
		typename: string;
		video_review: number;
	}

	interface RankingRegion extends BaseResponse {
		message: string;
		data: RankingRegionArchive[];
	}

	interface ViewData extends BaseResponse {
		data: DynamicRegionArchive;
	}

	interface UserInfo {
		mid: number;
		name: string;
		sex: string;
		face: string;
		sign: string;
		rank: number;
		level: number;
		jointime: number;
		moral: number;
		silence: number;
		birthday: string;
		coins: number;
		fans_badge: boolean;
		official: {
			role: number;
			title: string;
			desc: string;
		};
		vip: {
			type: number;
			status: number;
		};
		is_followed: boolean;
		top_photo: string;
		theme: {};
	}

	interface AccountData extends BaseResponse {
		data: UserInfo;
	}

	interface FavoriteFoldersCover {
		aid: number;
		// url
		pic: string;
		type: number;
	}

	interface FavoriteFoldersData {
		media_id: number;
		// 收藏夹id
		fid: number;
		// 归属用户id
		mid: number;
		// 收藏夹名字
		name: string;
		// 收藏夹最大存储数
		max_count: number;
		// 收藏夹当前存储数
		cur_count: number;
		atten_count: number;
		favoured: number;
		state: number;
		ctime: number;
		mtime: number;
		// 收藏夹封面
		cover: FavoriteFoldersCover[];
	}

	interface FavoriteFolders extends BaseResponse {
		data: FavoriteFoldersData[];
	}

	interface BangumiSponsor extends BaseResponse {
		result: {
			ep_bp: boolean;
			list: Array<{
				face: string;
				/* 虽然是string但是数值是0-1 */
				hidden: string;
				message: string;
				rank: string;
				uid: string;
				uname: string;
				vip: { vipStatus: number; vipType: number; };
			}>;
			users: number;
		};
	}

	interface PlayerMediaInfo {
		audioChannelCount: number;
		audioCodec: string;
		audioDateRate: number;
		audioSampleRate: number;
		fps: string;
		height: number;
		mimeType: string;
		sar: string;
		videoCodec: string;
		videoDataRate: number;
		width: number;
	}

	interface PlayerPlaylist {
		cid: number;
		dimension: {
			height: number;
			rotate: number;
			width: number;
		};
		duration: number;
		from: string;
		page: number;
		part: string;
		vid: string;
		weblink: string;
	}

	interface PlayerPlaylistResponse extends BaseResponse {
		data: PlayerPlaylist[];
	}

	interface PlayerStatisticsInfo {
		audioCurrentSegmentDuration: number;
		audioCurrentSegmentIndex: number;
		audioCurrentSegmentStartTime: number;
		audioTotalSegmentCount: number;
		audioURL: string;
		bufferHealth: number;
		decodedFrames: number;
		droppedFrames: number;
		playerType: string;
		speed: number;
		videoCurrentSegmentDuration: number;
		videoCurrentSegmentIndex: number;
		videoCurrentSegmentStartTime: number;
		videoTotalSegmentCount: number;
		videoURL: string;
	}

	interface PlayerVersion {
		lastModified: string;
		name: string;
		production: boolean;
		revision: string;
		version: string;
	}

	// TODO: finish this list
	interface Player {
		addEventListener(b?: any, c?: any): void;
		destroy(b: any): void;
		directiveDispatcher(b: any): void;
		exitFullScreen(): void;
		getBufferRate(): number;
		getCurrentTime(): number;
		getDuration(): number;
		getHeight(): number;
		getMediaInfo(): PlayerMediaInfo;
		getPlaylist(): PlayerPlaylist[] | null;
		getPlaylistIndex(): number;
		getPlayurl(): string;
		getSession(): string;
		getState(): 'IDEL'|'READY'|'BUFFERING'|'PLAYING'|'PAUSED'|'COMPLETE';
		getVersion(): PlayerVersion;
		getWidth(): number;
		isFullScreen(): boolean;
		isMute(): boolean;
		logger(): false;
		logger(b: boolean): undefined;
		mode(b: any): void;
		next(b?: any, c?: any, e?: any): void;
		option(b: any, c: any): void;
		pause(): void;
		play(): void;
		prev(): void;
		seek(time: number): void;
	}

	interface EpInfo {
		aid: number;
		badge: string;
		badge_type: number;
		cid: number;
		cover: string;
		duration: number;
		ep_id: number;
		episode_status: number;
		from: string;
		index: string;
		index_title: string;
		mid: number;
		page: number;
		pub_real_time: string;
		section_id: number;
		section_type: number;
		vid: string;
	}

	// TODO: finish this list
	// tslint:disable class-name
	interface __INITIAL_STATE__ {
		epInfo: EpInfo;
		epList: EpInfo[];
		videoData: DynamicRegionArchive;
	}

	interface __PGC_USERSTATE__ {
		dialog: {
			title: string;
		};
		login: number;
	}
	// tslint:enable class-name
}
