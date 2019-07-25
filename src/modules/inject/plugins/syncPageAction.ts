import { EXTENSION_ID } from '@/lib/extension';
import InjectModule from '@/lib/InjectModule';
import { Direct } from '@/modules/background/accountShare/config';
import RegExpPattern from '@/utils/RegExpPattern';

export default class SyncPageAction extends InjectModule {
	public remotePort: chrome.runtime.Port;
	public responseCollect: boolean = false;

	constructor() {
		super({
			name: 'plugin:syncPageAction',
			dependencies: [],
			run_at: RegExpPattern.videoUrlPattern,
			listener: {
				xhrrequest: 'sync',
				ajaxrequest: 'syncAjax',
			},
		});

		this.remotePort = chrome.runtime.connect(EXTENSION_ID, { name: 'sync:pluginAttach' });
	}

	public waitRemoteResponse() {

	}

	public sync({ requestURL, requestData, response }: joybook.InjectHost.XHREvent) {
		if (new RegExp('x/player/playurl', 'ig').test(requestURL)) {
			this.remotePort.postMessage({
				postName: 'sync:playurl',
				payload: [requestData, response],
			});
		} else if (new RegExp(Direct.heartbeat, 'ig').test(requestURL)) {
			this.remotePort.postMessage({
				postName: 'sync:heartbeat',
				payload: [requestData, response],
			});
		}
		return Promise.resolve();
	}

	public syncAjax({ requestURL }: joybook.InjectHost.AjaxEvent) {
	}
}
