declare namespace joybook {
	function log(...msg: any): void;
	function warn(...msg: any): void;
	function error(...msg: any): void;
}

declare namespace joybook.avblocker {
	export interface Archive {
		aid: number | undefined;
		cid: number | undefined;
		copyright: number | undefined;
		desc: string | undefined;
		owner: number | undefined;
		stat: {
			coin: number | undefined;
			danmaku: number | undefined;
			dislike: number | undefined;
			favorite: number | undefined;
			like: number | undefined;
			view: number | undefined;
		};
		title: string | undefined;
		tname: string | undefined;
		videos: number | undefined;
	}

	export interface ArchivesCache {
		[index: string]: bili.DynamicRegionArchive;
	}

	export interface OwnersCache {
		[index: string]: bili.UserInfo;
	}

	export interface GlobalBlockList extends BlockList {
		concatBlacklist: boolean;
	}

	export interface SectionBlockList extends BlockList {
		merge?: boolean;
	}

	export interface BlockList {
		aid: number[];
		cid: number[];
		copyright: number[];
		desc: string[];
		// dimension: bili.DynamicRegionArchive['dimension'][];
		// duration: {
		// 	min: number | string;
		// 	max: number | string;
		// }
		// 不喜欢的up主 mid
		owner: number[];
		stat: {
			coin: {
				min: number;
				max: number;
			} | boolean;
			danmaku: {
				min: number;
				max: number;
			} | boolean;
			dislike: {
				min: number;
				max: number;
			} | boolean;
			favorite: {
				min: number;
				max: number;
			} | boolean;
			like: {
				min: number;
				max: number;
			} | boolean;
			view: {
				min: number;
				max: number;
			} | boolean;
		};
		title: string[];
		tname: string[];
		// 分P数
		videos: {
			min: number;
			max: number;
		} | boolean;
	}

	export interface FullBlockList {
		global: GlobalBlockList;
		douga?: SectionBlockList;
		bangumi?: SectionBlockList;
		guochuang?: SectionBlockList;
		music?: SectionBlockList;
		dance?: SectionBlockList;
		game?: SectionBlockList;
		technology?: SectionBlockList;
		digital?: SectionBlockList;
		life?: SectionBlockList;
		kichiku?: SectionBlockList;
		fashion?: SectionBlockList;
		ad?: SectionBlockList;
		ent?: SectionBlockList;
		movie?: SectionBlockList;
		teleplay?: SectionBlockList;
		cinephile?: SectionBlockList;
		documentary?: SectionBlockList;
	}

	export interface RankData {
		rank: number;
		title: string;
		play: number;
		danmaku: number;
		mid: number;
		aid: number;
		pts: number;
	}
}

declare namespace joybook.mxhrr {
	export type AjaxJob = (param: any, oriResultTransformer: any) => any;
	export type XhrJob = (modified_response: string, requestData: string, requestURL: string, requestMethod: string) => any;
}
