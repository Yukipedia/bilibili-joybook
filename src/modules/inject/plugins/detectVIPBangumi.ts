import { EXTENSION_ID } from '@/lib/extension';
import InjectModule from '@/lib/InjectModule';
import RegExpPattern from '@/utils/RegExpPattern';

export default class DetectVIPBangumi extends InjectModule {
	public remotePort: chrome.runtime.Port;

	constructor() {
		super({
			name: 'plugin:detectVIPBangumi',
			run_at: RegExpPattern.bangumiUrlPattern,
			listener: {
				xhrrequest: 'detectVIPBangumi',
			},
		});

		this.remotePort = chrome.runtime.connect(EXTENSION_ID, {
			name: 'sync:pluginAttach',
		});
	}

	public detectVIPBangumi({ requestURL, requestData }: joybook.InjectHost.XHREvent) {
		if (requestURL.includes('x/web-interface/nav')) {
			console.log(requestURL);
			console.log(window.__PGC_USERSTATE__.dialog);
			if (window.__PGC_USERSTATE__.dialog) {
				this.remotePort.postMessage({
					postName: 'vip:requireVIPAccount',
					scope: 'VIP',
				});
			}
			// 如果在连续播放的情况下 要获取播放数据然后手动跳转过去
		} else if (requestURL.includes('/pgc/player/web/playurl')) {
			console.log(requestData);
			window.location.href = 'https://www.bilibili.com/video/av' + requestData.avid;
			// this.remotePort.postMessage({
			// 	postName: 'vip:requireVIPAccount',
			// 	scope: 'VIP',
			// });
		}
	}
}
