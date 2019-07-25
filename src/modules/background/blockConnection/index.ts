import BackgroundModule from '@/lib/BackgroundModule';

export default class BlockConnection extends BackgroundModule {
	constructor() {
		super({
			name: 'BlockConnection',
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
