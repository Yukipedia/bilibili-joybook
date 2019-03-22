import InjectModule from '@/lib/InjectModule';
import RegExpPattern from '@/utils/RegExpPattern';

import { waitUntilDomLoaded } from '@/utils/helper';

export const config = {
	name: 'AlwaysJumpTo',
	priority: 1,
	run_at: RegExpPattern.videoUrlPattern,
	storageOptions: {
		switch: 'switch.alwaysjumpto',
		defaultSwitch: true,
	},
	setting: {
		title: '自动跳转至上次观看时间',
		desc: '',
	},
};

export default class AlwaysJumpTo extends InjectModule {
	public accountShareStatus: boolean | undefined;
	constructor() {
		super({
			listener: {
				mutation: list => {
				},
				ajaxrequest: (host, payload) => {

				}
			},
		});
		this.accountShareStatus = undefined;
	}

	public launch(moduleNsp) {
		this.main(moduleNsp);
	}

	public main(moduleNsp) {
		// bilibili-player-video-toast-item-jump
		waitUntilDomLoaded<HTMLElement>(
			'.bilibili-player-video-toast-item-jump',
			false,
			() => window.player && typeof window.player.getState === 'function' && window.player.getState() === 'PLAYING',
		)
			.then(dom => {
				dom.click();
			})
			.catch(e => joybook.error(e));
	}
}
