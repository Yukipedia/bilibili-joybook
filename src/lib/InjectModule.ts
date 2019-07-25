import { parseCookie } from '@/utils/helper';
import RegExpPattern from '@/utils/RegExpPattern';
import axios, { AxiosInstance } from 'axios';
import { HostEvent } from './InjectHost';

export interface IInjectBaseModuleConstructor {
	readonly name: string;
	readonly run_at?: RegExp | RegExp[];
}

export interface IInjectModuleConstructor extends IInjectBaseModuleConstructor {
	readonly dependencies?: string[];

	readonly listener: {
		// tslint:disable typedef-whitespace max-line-length
		[HostEvent.DomContentLoaded]?: string | ((event: Event) => void);
		[HostEvent.AjaxRequest]?     : string | ((payload: joybook.InjectHost.AjaxEvent) => Promise<any> | void);
		[HostEvent.XHRRequest]?      : string | ((payload: joybook.InjectHost.XHREvent) => Promise<any> | void);
		[HostEvent.Mutation]?        : string | ((mutationList: MutationRecord) => Promise<any> | void);
		[HostEvent.PlayerBuffering]? : string | (() => Promise<any> | void);
		[HostEvent.PlayerReady]?     : string | (() => Promise<any> | void);
		[HostEvent.PlayerPlaying]?   : string | (() => Promise<any> | void);
		[HostEvent.PlayerPaused]?    : string | (() => Promise<any> | void);
		[HostEvent.PlayerIdel]?      : string | (() => Promise<any> | void);
		[HostEvent.PlayerComplete]?  : string | (() => Promise<any> | void);
		// tslint:enable typedef-whitespace max-line-length
	};

	readonly storageOptions: {
		area?: 'local' | 'sync';
		statusArea?: 'local' | 'sync';
		status: 'on' | 'off';
	};

	readonly setting: {
		title: string;
		desc?: string;
		// 如果有模块开/关后需要插件重启则指定此数值
		requireReload?: boolean;
	};
}

export type InjectPluginModuleConstructor = IInjectBaseModuleConstructor;

export default abstract class InjectModule {
	public readonly name: IInjectModuleConstructor['name'];
	public readonly run_at: RegExp | RegExp[];
	public readonly dependencies: IInjectModuleConstructor['dependencies'];
	public          listener: IInjectModuleConstructor['listener'];
	public          _listener: {[index: string]: any[]};
	public readonly storageOptions: IInjectModuleConstructor['storageOptions'];
	public readonly setting: IInjectModuleConstructor['setting'];
	public readonly axios: AxiosInstance = axios;

	constructor(options: IInjectModuleConstructor | InjectPluginModuleConstructor) {
		this.name = options.name;
		this.run_at = options.run_at || /./;
		this.dependencies = (options as IInjectModuleConstructor).dependencies;
		this.listener = (options as IInjectModuleConstructor).listener || {};
		this._listener = {
			ajaxrequest: [],
			xhrrequest: [],
			mutation: [],
			domcontentloaded: [],
		};
		this.storageOptions = (options as IInjectModuleConstructor).storageOptions;
		this.setting = (options as IInjectModuleConstructor).setting;
	}

	public get isVideo() {
		return !RegExpPattern.bangumiUrlPattern.test(location.href);
	}

	public get stardustVideo() {
		return parseCookie<any>(document.cookie).stardustvideo !== '-1';
	}

	public get stardustBangumi() {
		return parseCookie<any>(document.cookie).stardustpgcv === '0606';
	}

	public broadcast<K extends keyof joybook.InjectHost.HostEvent>(eventType: K, ev: joybook.InjectHost.HostEvent[K]) {
		for (const listener of this._listener[eventType]) {
			typeof listener !== 'undefined' && listener(ev);
		}
	}

	public addEventListener<K extends keyof joybook.InjectHost.HostEvent>(
		eventType: K,
		listener: (ev: joybook.InjectHost.HostEvent[K]) => any,
	): number {
		const _listener = this._listener[eventType];

		if (Array.isArray(this._listener[eventType])) {
			_listener.push(listener);
			return _listener.length - 1;
		}
		return -1;
	}

	public removeEventListener<K extends keyof joybook.InjectHost.HostEvent>(eventType: K, listenerIndex?: number): boolean {
		if (!Array.isArray(this._listener[eventType])) return false;

		typeof listenerIndex === 'number' ? delete this._listener[eventType][listenerIndex] : this.listener[eventType as HostEvent] = undefined;
		return true;
	}
}
