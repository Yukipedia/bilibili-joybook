import ChromeAsyncStorage from '@/utils/chrome/storage';
import EventEmiiter from 'eventemitter3';
import Module, { envContext } from './Module';

interface ModuleManagerConstructor {
	env: envContext;
	modules: Record<string, Module>;
}

const enum MessageEvent {
	GetLaunchedModule = 'get:launchedModule',
	ObserverModuleLaunchStatus = 'observer:moduleLaunchStatus',
}

interface Message {
	event: MessageEvent;
	[key: string]: any;
}

export default class ModuleManager extends EventEmiiter {
	public env: ModuleManagerConstructor['env'];
	public modules: ModuleManagerConstructor['modules'];
	public moduleNsp: { [key: string]: any };
	public storage?: ChromeAsyncStorage;
	public crossCheckQueue: any;
	public checkListComplete: boolean;

	constructor({ env, modules }: ModuleManagerConstructor) {
		super();

		if (env !== envContext.inject) this.storage = new ChromeAsyncStorage();
		this.env = env;
		this.modules = {};
		this.moduleNsp = {};
		this.checkListComplete = false;
		this.crossCheckQueue = [];
		this.addInComingMessageListener();
		if (modules) this.init(modules);
	}

	public init(modules) {
		this.crossCheckQueue = new Proxy(this.crossCheckQueue, {
			set: (target, prop, value) => {
				if (prop !== 'length') {
					this.crossCheck(value);
				}
				return true;
			},
		});

		// 实例化所有module
		Object.keys(modules).forEach(key => {
			this.modules[key] = new modules[key]();
		});

		if (this.storage) {
			this.storage.once('ready', () => {
				this.checklist();
			});
			this.storage.init();
		} else {
			this.checklist();
		}
	}

	/**
	 * 检查module以及dependencies
	 */
	public async checklist() {
		const modules = Object.values<Module>(this.modules).sort((a, b) => b.priority - a.priority);
		for (const module of modules) {
			const moduleDefaultSwitch = module.storageOptions.defaultSwitch;
			const moduleSwitch = module.storageOptions.switch;

			// 解决inject的chrome储存问题
			if (this.env === envContext.inject) {
				// 如果没有指定moduleSwitch则代表此模块是不能关闭的
				if (typeof moduleSwitch === 'undefined') {
					this.postLaunchedMessage(module);
					continue;
				}
				chrome.runtime.sendMessage(
					window.joybook.id,
					{
						name: 'serve',
						cmd: 'get:storage',
						payload: ['local', moduleSwitch],
					},
					response => {
						if (response) {
							this.postLaunchedMessage(module);
						} else if (response === null) {
							// 初始化开关状态
							chrome.runtime.sendMessage(
								window.joybook.id,
								{
									name: 'serve',
									cmd: 'set:storage',
									payload: ['local', moduleSwitch, moduleDefaultSwitch],
								},
							);
							if (moduleDefaultSwitch) this.postLaunchedMessage(module);
						}
					},
				);
				continue;
			}

			// 如果没有指定moduleSwitch则代表此模块是不能关闭的
			if (typeof moduleSwitch === 'undefined') {
				this.postLaunchedMessage(module);
			} else {
				const status = this.storage!.get<boolean>('local', moduleSwitch);
				if (status) {
					this.postLaunchedMessage(module);
				} else if (status === null) {
					this.storage!.set('local', moduleSwitch, moduleDefaultSwitch);
					if (moduleDefaultSwitch) this.postLaunchedMessage(module);
				}
			}
		}
		this.checkListComplete = true;
	}

	public postLaunchedMessage(module: Module) {
		module.run_at = module.run_at || [];
		if (!Array.isArray(module.run_at)) module.run_at = [module.run_at];
		if (!module.run_at.find(v => v.test(window.location.href))) return;
		const { storageOptions } = module;
		const launch = () => {
			const doLaunch = () => {
				console.log('launch', module.name);
				const namespace = module.launch(this.moduleNsp);
				if (namespace) this.moduleNsp[module.name] = namespace;
			};

			if (module.dependencies && module.dependencies.length > 0) {
				this.ensureDependencies(module.dependencies)
					.then((result: boolean) => {
						if (result) doLaunch();
						else this.crossCheckQueue.push({name: module.name, dependencies: module.dependencies});
					})
					.catch(e => {
						console.error(e);
					});
			} else {
				doLaunch();
			}
		};
		if (storageOptions.location && this.storage) {
			if (!this.storage.get(storageOptions.area, storageOptions.location, false)) {
				this.storage.set(storageOptions.area, storageOptions.location, storageOptions.defaultValue || {}).then(() => launch());
			} else launch();
		} else if (storageOptions.location && !this.storage) {
			chrome.runtime.sendMessage(
				window.joybook.id,
				{
					name: 'serve',
					cmd: 'get:storage',
					payload: [storageOptions.area, storageOptions.location, false],
				},
				response => {
					if (response) return launch();
					chrome.runtime.sendMessage(
						window.joybook.id,
						{
							name: 'serve',
							cmd: 'set:storage',
							payload: [storageOptions.area, storageOptions.location, storageOptions.defaultValue || {}],
						},
						() => launch(),
					);
				},
			);
		} else launch();
	}

	public async crossCheck({name, dependencies}) {
		console.log('crosscheck', dependencies);
		chrome.runtime.sendMessage(
			this.env === envContext.inject ? window.joybook.id : chrome.runtime.id,
			{
				event: MessageEvent.ObserverModuleLaunchStatus,
				dependencies,
			} as Message,
			(launchPermission: boolean) => {
				console.log('launchPermission', launchPermission);
				for (const i in this.modules) {
					if (this.modules[i].name !== name) continue;
					return this.modules[i].towerResponse(launchPermission, this.moduleNsp);
				}
				console.error('joybook: Object.values(this.modules).filter(v => v.name === moduleName);');
			},
		);
	}

	public ensureDependencies(dependencies: string[]): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const resolveDepend: boolean[] = [];
			for (const moduleName of dependencies) {
				// TODO: 在同一context的情况下 请求的module可能没有执行完毕
				// 导致代码直接认为不是这个context然后访问backgroundContext 但是确实是这个context只是module没有执行完毕
				// FIXED: 暂时的解决办法 把launched去除
				if (this.modules[moduleName]/** && this.modules[moduleName].launched */) {
					resolveDepend.push(true);
				}
			}
			if (resolveDepend.length >= dependencies.length) return resolve(true);
			chrome.runtime.sendMessage(
				this.env === envContext.inject ? window.joybook.id : chrome.runtime.id,
				{ event: MessageEvent.GetLaunchedModule },
				(response: string[]) => {
					if (chrome.runtime.lastError) {
						console.error(chrome.runtime.lastError);
						return reject(chrome.runtime.lastError);
					}
					for (const moduleName of dependencies) {
						if (response.includes(moduleName)) { resolveDepend.push(true); }
					}
					if (resolveDepend.length >= dependencies.length) return resolve(true);
					return resolve(false);
				},
			);
		});
	}

	private addInComingMessageListener() {
		try {
			chrome.runtime.onMessage.addListener(this.handleInComingMessage.bind(this));
			chrome.runtime.onMessageExternal.addListener(this.handleInComingMessage.bind(this));
		} catch (e) { return; }
	}

	private observerModuleLaunchStatus(dependencies: string[]) {
		return new Promise((resolve, reject) => {
			console.log('observerModuleLaunchStatus');
			// 此方法只存在content background环境
			if (!this.storage) return reject(new Error('observerModuleLaunchStatus should only exist on background/content environment.'));
			const moduleArray = Object.values(this.modules);
			const hasModule = moduleArray.filter(v => new RegExp(dependencies.join('|'), 'i').test(v.name));
			if (hasModule.length > 0) {
				const modulelaunched: string[] = [];
				let retryTime = 10;
				const walk = () => {
					for (const module of hasModule) {
						if (modulelaunched.includes(module.name)) continue;
						if (!this.storage!.get(module.storageOptions.area, module.storageOptions.switch, module.storageOptions.defaultSwitch)) {
							console.error(!this.storage!.get(module.storageOptions.area, module.storageOptions.switch, module.storageOptions.defaultSwitch));
							return resolve(false);
						}
						if (module.launched) modulelaunched.push(module.name);
					}
					if (modulelaunched.length === hasModule.length) return resolve(true);
					else {
						if (retryTime <= 0) return reject(new Error(`retry reached maxmium number. aborting - ${hasModule.map(v => v.name).join('/')}`));
						retryTime -= 1;
						setTimeout(walk, 300);
					}
				};
				walk();
			}
		});
	}

	private handleInComingMessage(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
		switch (message.event) {
			case MessageEvent.GetLaunchedModule:
				sendResponse(Object.values<Module>(this.modules).filter(m => m.launched === true).map(v => v.name));
				return;
			case MessageEvent.ObserverModuleLaunchStatus:
				this.observerModuleLaunchStatus(message.dependencies)
					.then(result => { console.log(result); sendResponse(result); })
					.catch(result => { console.log(result); sendResponse(false); });
				return true;
			default:
				break;
		}
		return true;
	}
}
