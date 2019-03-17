import Module, { envContext, ModuleConstructor } from '@/lib/Module';
import RegExpPattern from '@/utils/RegExpPattern';

export const config = {
	name: 'SkipSponsor',
	context: envContext.inject,
	priority: 1,
	run_at: RegExpPattern.bangumiUrlPatterb,
	storageOptions: {
		area: 'local',
		switch: 'switch.skipsponsor',
		defaultSwitch: true,
	},
	setting: {
		title: '跳过承包小伙伴',
		desc: '',
	},
} as ModuleConstructor;

export default class SkipSponsor extends Module {
	constructor() {
		super(config);
	}

	public launch(moduleNsp) {
		moduleNsp.MXHRR.addXHRJob((responseText: string, requestData: string, requestURL: string, requestMethod: string) => {
			if (RegExpPattern.sponsor.test(requestURL)) {
				this.monitor(JSON.parse(responseText));
			}
			return;
		});
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
			if (Math.floor(duration) === Math.floor(curTime)) return;

			if (Math.floor(duration - curTime) <= sponsorHoldTime) {
				setTimeout(() => { player.seek(duration); }, 1e3);
			}
		}, 1e3);
	}
}
