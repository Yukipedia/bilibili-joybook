import { BackgroundModuleConstructor } from '@/lib/BackgroundModule';
export default {
	name: 'AccountShare',
	storageOptions: {
		area: 'local',
		statusArea: 'sync',
		status: 'off',
	},
	setting: {
		title: '白嫖大会员',
		desc: '开启后，点击joybook扩展图标进行设置。',
	},
} as BackgroundModuleConstructor;

export const enum Direct {
	/* 账号导航栏 */
	watchHistory =             'x/v2/history',                                   // 观看历史
	newestFavList =            'x/v2/fav/video/newest',                          // 收藏夹
	stardustNewestFavList =    'medialist/gateway/coll/resource/recent',         // [星尘]收藏夹
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
	commentReport =            'x/v2/reply/report',                              // 举报评论
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
	playerso =                 'x/player.so',                                    // 播放器获取用户数据
}
