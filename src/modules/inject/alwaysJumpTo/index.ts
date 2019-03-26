import InjectModule from '@/lib/InjectModule';
import RegExpPattern from '@/utils/RegExpPattern';

export default class AlwaysJumpTo extends InjectModule {
	public accountShareStatus: boolean | undefined;

	constructor() {
		super({
			name: 'AlwaysJumpTo',
			listener: {
				mutation: 'jump',
			},
			run_at: RegExpPattern.videoUrlPattern,
			storageOptions: {
				status: 'on',
			},
			setting: {
				title: '自动跳转至上次观看时间',
			},
		});
	}

	public jump(mutation: MutationRecord) {
		if (
			mutation.type === 'childList' &&
			(mutation.target as HTMLElement).classList.contains('bilibili-player-video-toast-bottom')
		) {
			const addedNodes = (mutation.addedNodes[0] as HTMLElement);
			let jump;
			addedNodes.className === 'bilibili-player-video-toast-item' && (jump = addedNodes.querySelector('.bilibili-player-video-toast-item-jump'));
			jump && jump.click();
		}
	}
}
