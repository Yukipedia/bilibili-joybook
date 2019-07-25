import BackgroundModule from '@/lib/BackgroundModule';

export default class Giovanni extends BackgroundModule {
	public remotePort: chrome.runtime.Port[];

	constructor() {
		super({
			name: 'Giovanni',
		});

		this.remotePort = [];
	}

	public launch() {
		this.addEventListener('remoteConnect', this.handleRemoteConnect);
		this.addEventListener('remoteDisconnect', this.handleRemoteDisconnect);
		chrome.runtime.onMessage.addListener(message => {
			console.log(message);
		});
		chrome.runtime.onMessageExternal.addListener(message => {
			console.log(message);
		});
		this.launchComplete();
	}

	public handleRemoteDisconnect = ({ tabId }: joybook.BackgroundHost.RemoteDisconnect) => {
		const portIndex = this.remotePort.findIndex(v => v.sender!.tab!.id! === tabId);
		// 我想应该不会出现找不到的情况
		portIndex >= 0 && this.remotePort.splice(portIndex, 1);
	}

	public handleRemoteConnect = ({ port, tabId }: joybook.BackgroundHost.RemoteConnect) => {
		port.onMessage.addListener((message, port) => {
			// console.log(port);
		});
		this.remotePort.push(port);
	}

}
