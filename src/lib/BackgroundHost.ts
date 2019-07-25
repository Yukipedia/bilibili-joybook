import { get as propGet } from 'dot-prop';
import BackgroundModule from './BackgroundModule';

export default class BackgroundHost {
	public backgroundInstances: BackgroundModule[] = [];
	public remotePort: chrome.runtime.Port = null as any;

	constructor(modules: Record<string, typeof BackgroundModule>) {
		this.registerEvent();
		this.registerModules(modules);
	}

	public registerModules(modules: any): void {
		for (const key in modules) {
			const instance: BackgroundModule = new modules[key]();
			instance.once('launched', () => {
				if (!this.remotePort) return;
				this.remotePort.postMessage({
					postName: 'moduleLaunched',
					payload: [instance.name],
				});
			});
			this.backgroundInstances.push(instance);
		}
	}

	public onRemoteDisconnect = (port: any): void => {
		this.broadcast(this.backgroundInstances, 'remoteDisconnect', { port, tabId: propGet(port, 'sender.tab.id', undefined) });
	}

	public onRemoteConnect = (port: chrome.runtime.Port): void => {
		port.onMessage.addListener((message, port) => {
			if (message.postName === 'get:launchedModules') {
				console.log('host', message);
				port.postMessage({
					postName: 'return:launchedModules',
					payload: this.backgroundInstances.filter(instance => instance.launched).map(instance => instance.name),
				});
				return;
			}
			this.broadcast(this.backgroundInstances, 'remoteMessage', { port, tabId: propGet(port, 'sender.tab.id', undefined), message });
		});
		port.onDisconnect.addListener(this.onRemoteDisconnect);
		this.broadcast(this.backgroundInstances, 'remoteConnect', { port, tabId: propGet(port, 'sender.tab.id', undefined) });
	}

	public broadcast<K extends keyof joybook.BackgroundHost.HostEvent>(
		instances: BackgroundModule[],
		eventType: K,
		payload: joybook.BackgroundHost.HostEvent[K],
	): void {
		for (const instance of instances) {
			if (instance.listener[eventType].length) instance.broadcast(eventType, payload);
		}
	}

	public registerEvent(): void {
		chrome.runtime.onConnect.addListener(this.onRemoteConnect);
		chrome.runtime.onConnectExternal.addListener(this.onRemoteConnect);
	}
}
