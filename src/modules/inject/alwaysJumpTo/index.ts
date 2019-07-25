import InjectModule, { IInjectModuleConstructor } from '@/lib/InjectModule';
import RegExpPattern from '@/utils/RegExpPattern';

export const config = {
	name: 'AlwaysJumpTo',
	listener: {
		mutation: 'jump',
	},
	run_at: RegExpPattern.videoUrlPattern,
	storageOptions: {
		statusArea: 'sync',
		status: 'on',
	},
	setting: {
		title: '自动跳转至上次观看时间',
	},
} as IInjectModuleConstructor;

export default class AlwaysJumpTo extends InjectModule {
	public accountShareStatus: boolean | undefined;
	constructor() {
		super(config);
	}

	public jump(mutation: MutationRecord) {
		if (
			mutation.type === 'childList' &&
			(mutation.target as HTMLElement).classList.contains('bilibili-player-video-toast-bottom')
		) {
			const addedNodes = (mutation.addedNodes[0] as HTMLElement);
			if (!addedNodes) return;
			let jump;
			addedNodes.className === 'bilibili-player-video-toast-item' && (jump = addedNodes.querySelector('.bilibili-player-video-toast-item-jump'));
			if (jump && jump.innerText === '跳转播放') {
				jump.click();
				this.removeEventListener('mutation');
			}
		}
	}
}
