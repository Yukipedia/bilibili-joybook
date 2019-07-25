import { Direct } from '@/modules/background/accountShare/config';
import { getURLParameters } from '@/utils/helper';
import { EXTENSION_ID } from './extension';
import InjectModule from './InjectModule';

/* tslint:disable variable-name */
export const enum HostEvent {
	// tslint:disable typedef-whitespace
	DomContentLoaded = 'domcontentloaded',
	AjaxRequest = 'ajaxrequest',
	XHRRequest = 'xhrrequest',
	Mutation = 'mutation',
	PlayerBuffering = 'playerbuffering',
	PlayerReady = 'playerready',
	PlayerPlaying = 'playerplaying',
	PlayerPaused = 'playerpaused',
	PlayerIdel = 'playeridel',
	PlayerComplete = 'playercomplete',
	// tslint:enable typedef-whitespace
}

export default class InjectHost {
	// Inject环境的模组
	public injectInstances: InjectModule[] = [];
	public suspendInstances: InjectModule[] = [];
	public mutationObserver: MutationObserver;
	public remotePort: chrome.runtime.Port;
	public backgroundModules: string[] = [];

	constructor(modules: Record<string, typeof InjectModule>) {
		this.remotePort = chrome.runtime.connect(EXTENSION_ID);
		this.registerPortEvent();
		this.registerModules(modules);
		this.mutationObserver = new MutationObserver(this.handleMutation);
		this.injectHost();
	}

	private registerModules(modules: any) {
		const href = window.location.href;

		for (const key in modules) {
			const instance: InjectModule = new modules[key](this.remotePort);
			if (Array.isArray(instance.run_at)) {
				if (!(instance.run_at.findIndex((ex: RegExp) => ex.test(href)) > -1)) continue;
				if (Array.isArray(instance.dependencies) && instance.dependencies.length) this.suspendInstances.push(instance);
				else this.injectInstances.push(instance);
			} else if (instance.run_at.test(href)) {
				if (Array.isArray(instance.dependencies) && instance.dependencies.length) this.suspendInstances.push(instance);
				else this.injectInstances.push(instance);
			}
		}
		this.checkDependencies();
	}
	// TODO: 要有个专门存储历史事件的东西
	// 假如后台某个模组开的很慢，
	// 但是inject模组依赖此后台模组，
	// 那么在后台模组开启之前的事件，inject模组就不会接收到，这会导致inject模组不会执行。
	// NOTE: 测试看来 port 的互相传输消息是非常快的 估计就十几毫秒
	private async checkDependencies(modules?: string[]) {
		const messageHandler = (message: any) => {
			if (message.postName !== 'return:launchedModules') return;
			const backgroundModules: string[] = message.payload;
			for (const [index, instance] of this.suspendInstances.entries()) {
				const dependencies = instance.dependencies!;
				backgroundModules.forEach(moduleName => {
					const index = dependencies.findIndex(dependence => dependence === moduleName);
					index !== -1 && dependencies.splice(index, 1);
				});

				// 只有在dependencies长度为0时才允许运行
				if (dependencies.length === 0) {
					delete this.suspendInstances[index];
					this.injectInstances.push(instance);
				}
			}
		};
		if (modules) return messageHandler({ postName: 'return:launchedModules', payload: modules });
		this.remotePort.onMessage.addListener(messageHandler);
		this.remotePort.postMessage({ postName: 'get:launchedModules' });
	}

	private registerPortEvent() {
		this.remotePort.onMessage.addListener(message => {
			if (message.postName === 'moduleLaunched') {
				this.checkDependencies(message.payload);
			}
		});
	}

	private injectXHR() {
		const _this = this;

		// tslint:disable object-literal-shorthand only-arrow-functions
		window.XMLHttpRequest = new Proxy(window.XMLHttpRequest, {
			construct(target, args) {

				const container: {
					[key: string]: any,
				} = {};
				// @ts-ignore
				return new Proxy(new target(...args), {
					set: function(target: XMLHttpRequest, prop, value, receiver) {
						if (prop === 'onreadystatechange') {
							container.__onreadystatechange = value;
							const cb = value;
							value = function() {
								// if (target.responseURL.includes('x/player.so?id=cid')) {
								// 	// let json = JSON.parse(target.responseText);
								// 	console.log(target.responseText);
								// }
								(async function() {
									// responseType如果不是空的或者不是text则不执行;
									if (target.readyState === 4 && /^$|text/i.test(target.responseType)) {
										for (const instance of _this.injectInstances) {
											try {
												instance.broadcast('xhrrequest', {
													requestURL: container.requestURL,
													requestData: container.requestData,
													requestMethod: container.requestMethod,
													response: target.responseText,
												});

												if (typeof instance.listener.xhrrequest === 'function') {
													const result = await instance.listener['xhrrequest'].apply(instance, [{
														requestURL: container.requestURL,
														requestData: container.requestData,
														requestMethod: container.requestMethod,
														response: target.responseText,
													}]);
													if (result) container.responseText = result;
												} else if (typeof instance.listener.xhrrequest === 'string') {
													// await new Promise(resolve => null);
													// @ts-ignore instance 没有索引
													const result = await instance[instance.listener.xhrrequest].apply(instance, [
														{
															requestURL: container.requestURL,
															requestData: container.requestData,
															requestMethod: container.requestMethod,
															response: target.responseText,
														},
													]);
													console.log(instance.name, result);
													if (result) container.responseText = result;
												}
											} catch (e) {
												joybook.error(e);
												throw e;
											}
										}
									}
									return cb.apply(container.responseText ? receiver : this, arguments);
								})();
							};
						}
						(<any> target)[prop] = value;
						return true;
					},
					get: function(target: XMLHttpRequest, prop, receiver) {
						// console.log(target[prop]);
						// @ts-ignore
						if (prop in container) return container[prop];
						let value = (<any> target)[prop];
						if (typeof value === 'function') {
							const func = value;
							value = function() {
								if (prop === 'open') {
									container.requestData = getURLParameters(arguments[1]);
									container.requestMethod = arguments[0];
									container.requestURL = arguments[1];
									if (
										new RegExp(Direct.heartbeat, 'ig').test(arguments[1]) ||
										new RegExp(Direct.playerso, 'ig').test(arguments[1])
									) {
										arguments[0] = 'GET';
										arguments[1] = 'https://moeocean.com';
									}
								} else if (prop === 'send') {
									arguments[0] && (container.requestData = getURLParameters(arguments[0]));
								}

								return func.apply(target, arguments);
							};
						}
						return value;
					},
				});
			},
		});
	}

	private injectAjax() {
		Promise.prototype.compose = function(transformer) {
			return transformer ? transformer(this) : this;
		};
		const _this = this;
		function doInject() {
			// @ts-ignore
			const originalAjax = $.ajax;
			// @ts-ignore
			$.ajax = function(arg0, arg1) {
				let param;
				if (arg1 === undefined) {
					param = arg0;
				} else {
					arg0 && (arg1.url = arg0);
					param = arg1;
				}

				let oriSuccess = param.success;
				let oriError = param.error;
				let mySuccess;
				let myError;
				let oriResultTransformer;
				// 投递结果的transformer, 结果通过oriSuccess/Error投递
				const dispatchResultTransformer = (p: any) => p
					.then((r: any) => oriSuccess(r))
					.catch((e: any) => oriError(e));

				for (const instance of _this.injectInstances) {
					try {
						instance.broadcast('ajaxrequest', {
							response: param,
							requestURL: param.url,
							requestData: param.data,
							requestMethod: param,
						});
						if (typeof instance.listener.ajaxrequest === 'function') {
							const result = instance.listener.ajaxrequest.apply(instance, [{
								response: param,
								requestURL: param.url,
								requestData: param.data,
								requestMethod: param,
							}]);
							if (result) oriResultTransformer = result;
						} else if (typeof instance.listener.ajaxrequest === 'string') {
							// @ts-ignore
							const result = instance[instance.listener.ajaxrequest].apply(instance, [{
								response: param,
								requestURL: param.url,
								requestData: param.data,
								requestMethod: param,
							}]);
							if (result) oriResultTransformer = result;
						}
					} catch (e) {
						joybook.error(e);
						throw e;
					}
				}

				if (oriResultTransformer) {
					new Promise((resolve, reject) => {
						mySuccess = resolve;
						myError = reject;
					})
						.compose(oriResultTransformer)
						.compose(dispatchResultTransformer);
				}

				// 若外部使用param.success处理结果, 则替换param.success
				if (oriSuccess && mySuccess) {
					param.success = mySuccess;
				}
				// 处理替换error
				if (oriError && myError) {
					param.error = myError;
				}
				// default
				const xhr = originalAjax.apply(this, [param]);

				// 若外部使用xhr.done()处理结果, 则替换xhr.done()
				if (!oriSuccess && mySuccess) {
					xhr.done(mySuccess);
					xhr.done = function(success: any) {
						oriSuccess = success; // 保存外部设置的success函数
						return xhr;
					};
				}
				// 处理替换error
				if (!oriError && myError) {
					xhr.fail(myError);
					xhr.fail = function(error: any) {
						oriError = error;
						return xhr;
					};
				}
				return xhr;
			};
		}

		if (!window.jQuery) {
			let jQuery: any;
			Object.defineProperty(window, 'jQuery', {
				configurable: true,
				enumerable: true,
				set: function(v) {
					jQuery = v;
					doInject();
				},
				get: function() {
					return jQuery;
				},
			});
		} else {
			doInject();
		}
	}

	private injectMutation() {
		this.mutationObserver.observe(document.documentElement, {
			attributes: true,
			characterData: true,
			childList: true,
			subtree: true,
		});
	}

	private injectEvent() {
		document.addEventListener('DOMContentLoaded', () => {
			setTimeout(() => {
				this.broadcast(this.injectInstances, HostEvent.DomContentLoaded);
			}, 0);
		});
	}

	private handleMutation = (mutationList: MutationRecord[]) => {
		for (const mutation of mutationList) {
			this.broadcast(this.injectInstances, HostEvent.Mutation, mutation);
		}
	}

	private broadcast(instances: InjectModule[], eventType: keyof joybook.InjectHost.HostEvent, payload?: any) {
		for (const instance of instances) {
			try {
				if (instance._listener[eventType].length) instance.broadcast(eventType, payload);
				if (!instance.listener[eventType]) continue;
				if (typeof instance.listener[eventType] === 'function') {
					// @ts-ignore
					instance.listener[eventType].apply(instance, [payload]);
				} else if (typeof instance.listener[eventType] === 'string') {
					// @ts-ignore
					instance[instance.listener[eventType]].apply(instance, [payload]);
				}
			} catch (e) {
				joybook.error(e);
				throw e;
			}
		}
	}

	private injectJoybookLogger() {
		const ori_consoleLog = console.log;
		function log(...msg: any): void {
			return ori_consoleLog.call(this, '%cJoyBook:', `background: #00897B; color: #B2DFDB;`, ...msg);
		}
		function warn(...msg: any): void {
			return ori_consoleLog.call(this, '%cJoyBook:', `background: #FB8C00; color: #FFCA28;`, ...msg);
		}
		function error(...msg: any): void {
			return ori_consoleLog.call(this, '%cJoyBook:', `background: #D81B60; color: #F8BBD0;`, ...msg);
		}
		window.joybook = {
			log: log,
			warn: warn,
			error: error,
		};
	}

	private injectHost() {
		this.injectJoybookLogger();
		this.injectAjax();
		this.injectXHR();
		this.injectMutation();
		this.injectEvent();
	}
}
