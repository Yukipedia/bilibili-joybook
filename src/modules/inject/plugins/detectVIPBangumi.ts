import { EXTENSION_ID } from '@/lib/extension';
import InjectModule from '@/lib/InjectModule';
import RegExpPattern from '@/utils/RegExpPattern';

export default class DetectVIPBangumi extends InjectModule {
	public remotePort: chrome.runtime.Port;

	constructor() {
		super({
			name: 'plugin:detectVIPBangumi',
			run_at: RegExpPattern.videoUrlPattern,
			listener: {
				xhrrequest: 'detectVIPBangumi',
				mutation: 'add',
			},
		});

		this.remotePort = chrome.runtime.connect(EXTENSION_ID, {
			name: 'sync:pluginAttach',
		});
	}

	public detectVIPBangumi({ requestURL }: joybook.InjectHost.XHREvent) {
		if (requestURL.includes('x/web-interface/nav')) {
			if (window.__PGC_USERSTATE__ && window.__PGC_USERSTATE__.dialog) {
				this.remotePort.postMessage({
					postName: 'vip:requireVIPAccount',
					scope: 'VIP',
				});
			}
		}
	}

	public add(mutation: MutationRecord) {
		if ((mutation.target as HTMLElement).classList.contains("bui-select-wrap")) {
			const target = mutation.target as HTMLDivElement;
			const value = ['74', '112', '116'];
			const items = target.querySelectorAll(".bui-select-item");
			items.forEach(item => {
				if (value.includes(item.getAttribute('data-value') as string)) {
					item.addEventListener('click', () => {
						this.remotePort.postMessage({
							postName: 'vip:click',
						})
					})
				};
			});
		}
	}
}
