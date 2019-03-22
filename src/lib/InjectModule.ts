import axios, { AxiosInstance } from 'axios';

import {
	HostEvent,
} from './InjectHost';
import { parseCookie } from '@/utils/helper';

export interface InjectBaseModuleConstructor {
	readonly name: string;
	readonly priority: number;
	readonly run_at?: RegExp | RegExp[];
}

export interface InjectModuleConstructor extends InjectBaseModuleConstructor {
	readonly dependencies?: string[];

	readonly listener: {
		// tslint:disable typedef-whitespace max-line-length
		[HostEvent.DomContentLoaded]?: (event: Event) => void | string;
		[HostEvent.AjaxRequest]?     : (host, payload: { requestURL: string, requestData: Record<string, string>, requestMethod: string, response }) => Promise<any> | string | void;
		[HostEvent.XHRRequest]?      : (requestURL: string, requestData: Record<string, string>, requestMethod: string, response) => Promise<any> | string | void;
		[HostEvent.Mutation]?        : (mutationList: MutationRecord) => Promise<any> | string | void;
		[HostEvent.PlayerBuffering]? : () => Promise<any> | string | void;
		[HostEvent.PlayerReady]?     : () => Promise<any> | string | void;
		[HostEvent.PlayerPlaying]?   : () => Promise<any> | string | void;
		[HostEvent.PlayerPaused]?    : () => Promise<any> | string | void;
		[HostEvent.PlayerIdel]?      : () => Promise<any> | string | void;
		[HostEvent.PlayerComplete]?  : () => Promise<any> | string | void;
		// tslint:enable typedef-whitespace max-line-length
	};

	readonly storageOptions: {
		area: 'local' | 'sync';
		status: 'on' | 'off';
		location?: string;
		defaultValue?: any;
	};

	readonly setting: {
		title: string;
		desc: string;
		// 如果有模块开/关后需要插件重启则指定此数值
		requireReload?: boolean;
	};
}

export type InjectPluginModuleConstructor = InjectBaseModuleConstructor;

export default abstract class InjectModule {
	public readonly name: InjectModuleConstructor['name'];
	public readonly run_at: InjectModuleConstructor['run_at'];
	public readonly priority: InjectModuleConstructor['priority'];
	public readonly dependencies: InjectModuleConstructor['dependencies'];
	public readonly listener: InjectModuleConstructor['listener'];
	public readonly storageOptions: InjectModuleConstructor['storageOptions'];
	public readonly setting: InjectModuleConstructor['setting'];
	public readonly axios: AxiosInstance;

	constructor(options: InjectModuleConstructor) {
		this.name = options.name;
		this.run_at = options.run_at || /./;
		this.priority = options.priority;
		this.dependencies = options.dependencies;
		this.listener = options.listener || {};
		this.storageOptions = options.storageOptions;
		this.setting = options.setting;
		this.axios = axios;
	}

	public get stardustVideo() {
		return parseCookie<any>(document.cookie).stardustvideo !== '-1';
	}

	public get stardustBangumi() {
		return parseCookie<any>(document.cookie).stardustpgcv !== '0';
	}
}
