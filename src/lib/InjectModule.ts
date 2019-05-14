import axios, { AxiosInstance } from 'axios';
import RegExpPattern from '@/utils/RegExpPattern';

import {
	_HostEvent,
	HostEvent,
} from './InjectHost';
import { parseCookie } from '@/utils/helper';

export interface InjectBaseModuleConstructor {
	readonly name: string;
	readonly run_at?: RegExp | RegExp[];
}

export interface InjectModuleConstructor extends InjectBaseModuleConstructor {
	readonly dependencies?: string[];

	readonly listener: {
		// tslint:disable typedef-whitespace max-line-length
		[HostEvent.DomContentLoaded]?: string | ((event: Event) => void);
		[HostEvent.AjaxRequest]?     : string | ((payload: jblib.AjaxEvent) => Promise<any> | void);
		[HostEvent.XHRRequest]?      : string | ((payload: jblib.XHREvent) => Promise<any> | void);
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
		status: 'on' | 'off';
		location?: string;
	};

	readonly setting: {
		title: string;
		desc?: string;
		// 如果有模块开/关后需要插件重启则指定此数值
		requireReload?: boolean;
	};
}

export type InjectPluginModuleConstructor = InjectBaseModuleConstructor;

export default abstract class InjectModule {
	public readonly name: InjectModuleConstructor['name'];
	public readonly run_at: InjectModuleConstructor['run_at'];
	public readonly dependencies: InjectModuleConstructor['dependencies'];
	public          listener: InjectModuleConstructor['listener'];
	public          _listener: {[index: string]: any[]};
	public readonly storageOptions: InjectModuleConstructor['storageOptions'];
	public readonly setting: InjectModuleConstructor['setting'];
	public readonly axios: AxiosInstance;

	constructor(options: InjectModuleConstructor | InjectPluginModuleConstructor) {
		this.name = options.name;
		this.run_at = options.run_at || /./;
		this.dependencies = (options as InjectModuleConstructor).dependencies;
		this.listener = (options as InjectModuleConstructor).listener || {};
		this._listener = {
			ajaxrequest: [],
			xhrrequest: [],
			mutation: [],
			domcontentloaded: [],
		};
		this.storageOptions = (options as InjectModuleConstructor).storageOptions;
		this.setting = (options as InjectModuleConstructor).setting;
		this.axios = axios;
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

	public broadcast<K extends keyof _HostEvent>(eventType: K, ev: _HostEvent[K]) {
		for (const listener of this._listener[eventType]) {
			typeof listener !== 'undefined' && listener(ev);
		}
	}

	public addEventListener<K extends keyof _HostEvent>(eventType: K, listener: (ev: _HostEvent[K]) => any): number {
		const _listener = this._listener[eventType];

		if (Array.isArray(this._listener[eventType])) {
			_listener.push(listener);
			return _listener.length - 1;
		}
		return -1;
	}

	public removeEventListener<K extends keyof _HostEvent>(eventType: K, listenerIndex?: number): boolean {
		if (!Array.isArray(this._listener[eventType])) return false;

		typeof listenerIndex === 'number' ? delete this._listener[eventType][listenerIndex] : this.listener[eventType as string] = undefined;
		return true;
	}
}
