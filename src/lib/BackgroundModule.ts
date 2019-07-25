import ChromeAsyncStorage from '@/utils/chrome/storage';
import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'eventemitter3';

export interface IBackgroundBaseModuleConstructor {
	readonly name: string;
}

type storageArea = 'local' | 'sync';

export interface BackgroundModuleConstructor extends IBackgroundBaseModuleConstructor {
	storageOptions: {
		readonly area: storageArea;
		readonly statusArea: storageArea;
		status: 'on' | 'off';
	};
	readonly setting: {
		title: string;
		desc: string;
	};
}

export default abstract class BackgroundModule extends EventEmitter {
	public readonly axios: AxiosInstance = axios;
	public          disposed: boolean = false;
	public          launched: boolean = false;
	public          listener: Record<keyof joybook.BackgroundHost.HostEvent, any[]>;
	public readonly name: BackgroundModuleConstructor['name'];
	public readonly storage: ChromeAsyncStorage = new ChromeAsyncStorage();
	// TODO: database
	// public          database: ChromeAsyncStorage = null as any;
	public readonly storageOptions: BackgroundModuleConstructor['storageOptions'];

	public constructor(options: IBackgroundBaseModuleConstructor | BackgroundModuleConstructor) {
		super();

		this.name = options.name;
		this.listener = {
			remoteConnect: [],
			remoteDisconnect: [],
			remoteMessage: [],
		};
		this.storageOptions = (<BackgroundModuleConstructor> options).storageOptions;
		this.storage.once('ready', () => {
			const status = this.register();
			if (status) {
				const result = this.launch();
				if (result && result.then) result.then(this.launchComplete);
			}
		});
		this.storage.init();
	}

	public get persistent(): Boolean {
		return !this.storageOptions;
	}

	protected launchComplete = (): void => {
		this.launched = true;
		this.emit('launched');
	}

	public abstract launch(): void | Promise<void>;

	protected register(): Boolean {
		// 常驻模块
		if (this.persistent) return true;
		const status = this.storage.get<'on' | 'off'>(this.storageOptions!.statusArea, `module.${this.name}.status`, null);
		if (status === null) {
			this.storage.set(this.storageOptions!.statusArea, `module.${this.name}.status`, this.storageOptions!.status);
			return this.storageOptions!.status === 'on' ? true : false;
		}
		return status === 'on' ? true : false;
	}

	protected async disable(): Promise<void> {
		if (this.persistent) return;
		this.disposed = true;
		const statusArea = this.storageOptions!.statusArea;
		await this.storage.untilReady();
		this.storage.set(statusArea, `module.${this.name}.status`, 'off');
	}

	public broadcast<K extends keyof joybook.BackgroundHost.HostEvent>(eventType: K, ev: joybook.BackgroundHost.HostEvent[K]): void {
		for (const listener of this.listener[eventType]) {
			typeof listener !== 'undefined' && listener(ev);
		}
	}

	protected addEventListener<K extends keyof joybook.BackgroundHost.HostEvent>(
		eventType: K,
		listener: (ev: joybook.BackgroundHost.HostEvent[K]) => any,
	): number {
		if (Array.isArray(this.listener[eventType])) {
			this.listener[eventType].push(listener);
			return this.listener[eventType].length - 1;
		}
		return -1;
	}

	protected removeEventListener<K extends keyof joybook.BackgroundHost.HostEvent>(eventType: K, listenerIndex?: number): boolean {
		if (!Array.isArray(this.listener[eventType])) return false;

		if (typeof listenerIndex === 'number') delete this.listener[eventType][listenerIndex];
		return true;
	}
}
