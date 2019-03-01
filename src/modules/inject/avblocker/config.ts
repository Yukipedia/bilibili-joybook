import { envContext, ModuleConstructor } from '@/lib/Module';
import RegExpPattern from '@/utils/RegExpPattern';

export const RID = {
	douga: 1,
	bangumi: 13,
	guochuang: 168,
	music: 3,
	dance: 129,
	game: 4,
	technology: 36,
	digital: 188,
	life: 160,
	kichiku: 119,
	fashion: 155,
	// 不知道如何获取广告的数据
	// ad: 165,
	ent: 5,
	movie: 23,
	teleplay: 11,
	cinephile: 181,
	documentary: 177,
};

const defaultValue = {
	global: {
		aid: [],
		cid: [],
		copyright: [],
		desc: [],
		owner: [],
		stat: {
			coin: false,
			danmaku: false,
			dislike: false,
			favorite: false,
			like: false,
			view: false,
		},
		title: [],
		tname: [],
		videos: false,
		concatBlacklist: false,
	},
};

for (const name in RID) {
	defaultValue[name] = {
		aid: [],
		cid: [],
		copyright: [],
		desc: [],
		owner: [],
		stat: {
			coin: false,
			danmaku: false,
			dislike: false,
			favorite: false,
			like: false,
			view: false,
		},
		title: [],
		tname: [],
		videos: false,
		merge: true,
	};
}

export default {
	name: 'AVBlocker',
	context: envContext.inject,
	dependencies: ['MXHRR'],
	storageOptions: {
		area: 'sync',
		defaultSwitch: true,
		switch: 'switch.avblocker',
		location: 'module.avblocker',
		defaultValue,
	},
	priority: 8,
	run_at: RegExpPattern.homeUrlPattern,
	setting: {
		title: 'AVBlocker',
		desc: '阻挡符合条件的av',
	},
} as ModuleConstructor;
