import axios, { AxiosInstance } from 'axios';

import {
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
		[HostEvent.AjaxRequest]?     : string | ((host, payload: { requestURL: string, requestData: Record<string, string>, requestMethod: string, response }) => Promise<any> | void);
		[HostEvent.XHRRequest]?      : string | ((requestURL: string, requestData: Record<string, string>, requestMethod: string, response) => Promise<any> | void);
		[HostEvent.Mutation]?        : {
			options: MutationObserverInit;
			handler: string | ((mutationList: MutationRecord) => Promise<any> | void);
		};
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
		defaultValue?: any;
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
	public readonly listener: InjectModuleConstructor['listener'];
	public readonly storageOptions: InjectModuleConstructor['storageOptions'];
	public readonly setting: InjectModuleConstructor['setting'];
	public readonly axios: AxiosInstance;

	constructor(options: InjectModuleConstructor | InjectPluginModuleConstructor) {
		this.name = options.name;
		this.run_at = options.run_at || /./;
		this.dependencies = (options as InjectModuleConstructor).dependencies;
		this.listener = (options as InjectModuleConstructor).listener || {};
		this.storageOptions = (options as InjectModuleConstructor).storageOptions;
		this.setting = (options as InjectModuleConstructor).setting;
		this.axios = axios;
	}

	public get stardustVideo() {
		return parseCookie<any>(document.cookie).stardustvideo !== '-1';
	}

	public get stardustBangumi() {
		return parseCookie<any>(document.cookie).stardustpgcv !== '0';
	}
}
