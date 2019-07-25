import InjectModule, { IInjectModuleConstructor } from '@/lib/InjectModule';
import RegExpPattern from '@/utils/RegExpPattern';


export const config = {
	name: 'DisableDanmakuMask',
	run_at: RegExpPattern.videoUrlPattern,
	listener: {
		mutation: 'disableDanmakuMask',
	},
	storageOptions: {
		statusArea: 'local',
		status: 'on',
	},
	setting: {
		title: '关闭弹幕蒙层(弹幕会遮挡视频人物)',
	},
} as IInjectModuleConstructor;

export default class DisableDanmakuMask extends InjectModule {
	constructor() {
		super(config);
	}

	public disableDanmakuMask(mutation: MutationRecord) {
		if ((<HTMLElement> mutation.target).className !== 'bilibili-player-video-danmaku' || document.getElementById('maskDisable')) return;

		const style = document.createElement('style');
		style.id = 'maskDisable';
		style.innerText = `.bilibili-player .bilibili-player-video-danmaku { -webkit-mask-image: unset !important }`;
		document.body.appendChild(style);
	}
}
