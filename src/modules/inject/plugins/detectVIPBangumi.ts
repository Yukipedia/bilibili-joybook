import InjectModule from '@/lib/InjectModule';
import { EXTENSION_ID } from '@/lib/extension';

export default class DetectVIPBangumi extends InjectModule {
	public remotePort: chrome.runtime.Port;

	constructor() {
		super({
			name: 'plugin:detectVIPBangumi',
			listener: {
				domcontentloaded: 'main',
			},
		});


		this.remotePort = chrome.runtime.connect(EXTENSION_ID, { name: 'sync:pluginAttach' });
	}

	public main() {
		console.log(window.__PGC_USERSTATE__);

		if (window.__PGC_USERSTATE__.dialog) {
			this.remotePort.postMessage({
				postName: 'isVIP',
				payload: [

				],
			});
		}

	}
}
