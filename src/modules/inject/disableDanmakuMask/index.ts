import Module, { envContext, ModuleConstructor } from '@/lib/Module';
import RegExpPattern from '@/utils/RegExpPattern';

import { waitUntilDomLoaded } from '@/utils/helper';

export const config = {
	name: 'DisableDanmakuMask',
	context: envContext.inject,
	priority: 1,
	run_at: RegExpPattern.videoUrlPattern,
	storageOptions: {
		area: 'local',
		switch: 'switch.disabledanmakumask',
		defaultSwitch: true,
	},
	setting: {
		title: '关闭弹幕蒙层(弹幕会遮挡视频人物)',
		desc: '',
	},
} as ModuleConstructor;

export default class DisableDanmakuMask extends Module {
	constructor() {
		super(config);
	}

	public launch(moduleNsp) {
		waitUntilDomLoaded<HTMLElement>(
			'.bilibili-player .bilibili-player-video-danmaku',
			false,
			() => window.player && typeof window.player.getState === 'function' && window.player.getState() === 'PLAYING',
		)
			.then(dom => {
				const style = document.createElement('style');
				style.innerText = `.bilibili-player .bilibili-player-video-danmaku { -webkit-mask-image: unset !important }`;
				document.body.appendChild(style);
			})
			.catch(e => joybook.error(e));
	}
}
