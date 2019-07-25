import InjectModule, { IInjectModuleConstructor } from '@/lib/InjectModule';
import RegExpPattern from '@/utils/RegExpPattern';

export const config = {
	name: 'SkipSponsor',
	run_at: RegExpPattern.bangumiUrlPattern,
	listener: {
		xhrrequest: 'detectSponsprRequest',
	},
	storageOptions: {
		statusArea: 'local',
		status: 'on',
	},
	setting: {
		title: '跳过承包小伙伴',
	},
} as IInjectModuleConstructor;

export default class SkipSponsor extends InjectModule {
	constructor() {
		super(config);
	}

	public detectSponsprRequest(payload: joybook.InjectHost.XHREvent) {
		if (RegExpPattern.sponsor.test(payload.requestURL)) {
			this.monitor(JSON.parse(payload.response));
			this.listener.xhrrequest = undefined;
		}
		return;
	}

	public monitor(response: bili.BangumiSponsor) {
		setInterval(() => {
			const player = window.player;
			if (!player) return;
			const duration = player.getDuration();
			const curTime = player.getCurrentTime();
			const sponsorHoldTime = 15;

			// 因为sponsor列表只获取一次 如果连续看的话clearInterval就会导致此功能失效
			// 如果已经跳转了则忽略
			if (curTime === duration) return;

			if (duration - curTime <= sponsorHoldTime) {
				player.seek(duration);
			}
		}, 1e3);
	}
}
