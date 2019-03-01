import { parseCookie } from '@/utils/helper';
import axios, { AxiosInstance } from 'axios';

export type NspValue = Record<string, () => void>;

export const enum envContext {
	popup = 'popup',
	background = 'background',
	content = 'content',
	inject = 'inject',
}

export interface BaseModuleConstructor {
	readonly name: string;
	readonly context: envContext;
	readonly priority: number;
	readonly run_at?: RegExp | RegExp[];
}

export interface ModuleConstructor extends BaseModuleConstructor {
	readonly permissions?: {
		request: string[];
		origins?: string[];
	};
	readonly dependencies?: string[];
	readonly storageOptions: {
		area: 'local' | 'sync';
		switch: string;
		defaultSwitch: boolean;
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
export type PluginModuleConstructor = BaseModuleConstructor;

export default abstract class Module {
	public name: ModuleConstructor['name'];
	public context: ModuleConstructor['context'];
	public run_at: ModuleConstructor['run_at'];
	public permissions: ModuleConstructor['permissions'];
	public dependencies: ModuleConstructor['dependencies'];
	public storageOptions: ModuleConstructor['storageOptions'];
	public setting: ModuleConstructor['setting'];
	public priority: ModuleConstructor['priority'];
	public disposed: boolean;
	public launched: boolean;
	public axios: AxiosInstance;

	constructor(module: ModuleConstructor | BaseModuleConstructor) {
		this.name = module.name;
		this.context = module.context;
		this.run_at = module.run_at || /./;
		this.permissions = (<ModuleConstructor> module).permissions;
		this.dependencies = (<ModuleConstructor> module).dependencies;
		this.storageOptions = (<ModuleConstructor> module).storageOptions || {};
		this.setting = (<ModuleConstructor> module).setting || {};
		this.priority = module.priority;
		this.disposed = false;
		this.launched = false;
		this.axios = axios;
	}

	public launch(moduleNsp?: Record<string, NspValue>): any {}

	public get stardustVideo() {
		return parseCookie<any>(document.cookie).stardustvideo !== '-1';
	}

	public get stardustBangumi() {
		return parseCookie<any>(document.cookie).stardustpgcv !== '0';
	}

	public towerResponse(launchPermission: boolean, moduleNsp?: { [key: string]: NspValue }) {
		if (launchPermission) this.launch(moduleNsp);
	}

	public launchComplete() {
		this.launched = true;
	}
}
