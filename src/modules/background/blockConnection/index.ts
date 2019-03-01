import Module, { envContext } from '@/lib/Module';

export default class BlockConnection extends Module {
	constructor() {
		super({
			name: 'BlockConnection',
			context: envContext.background,
			priority: 1,
		});
	}

	public launch() {
		this.main();
		this.launchComplete();
	}

	public main() {
		chrome.webRequest.onBeforeSendHeaders.addListener(
			details => {
				if (
					new RegExp('(log/web|log-reporter.js)', 'ig').test(details.url)
				) {
					return {
						cancel: true,
					};
				}
				return;
			},
			{ urls: [
					'*://*.bilibili.com/*',
					'*://*.hdslb.com/*',
				],
			},
			['blocking', 'requestHeaders'],
		);
	}
}
