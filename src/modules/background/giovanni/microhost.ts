import { EXTENSION_ID } from '@/lib/extension';
import { getURLParameters } from '@/utils/helper';

class MicroHost {
	private responseCollect: Record<string, any>;
	private remotePort: chrome.runtime.Port;

	constructor() {
		this._injectXHR();
		this._injectAjax();
		this.remotePort = this._connectRemote();
		this.responseCollect = {};
	}

	private _injectXHR() {
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
										_this.remotePort.postMessage({
											postName: 'sync:responseText',
											payload: {
												url: container.requestURL.split('?')[0],
												responseText: target.responseText,
											},
										});
										_this.responseCollect[container.requestURL.split('?')[0]] = target.responseText;
									}
									return cb.apply(container.responseText ? receiver : this, arguments);
								})();
							};
						}
						(<any> target)[prop] = value;
						return true;
					},
					get: function(target: XMLHttpRequest, prop, receiver) {
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

	private _injectAjax() {
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
	private _connectRemote() {
		const port = chrome.runtime.connect(EXTENSION_ID, {
			name: 'sync:connect',
		});

		// port.onMessage.addListener(message => {
		// 	// 当会员用户 heartbeat 发送时 正常用户也同步heartbeat？
		// 	if (message.postName === 'sync:heartbeat') {
		// 		let data = '';
		// 		for (let [dataKey, dataValue] of Object.entries(message.payload[0])) {
		// 			if (dataKey === 'csrf') {
		// 				dataValue = parseCookie<{ bili_jct: string }>(document.cookie).bili_jct;
		// 			}
		// 			data += `${dataKey}=${dataValue}&`;
		// 		}
		// 		data.substring(0, data.length - 1);

		// 		// @ts-ignore
		// 		$.ajax({
		// 			type: 'POST',
		// 			url: 'https://api.bilibili.com/x/report/web/heartbeat',
		// 			data: data,
		// 		});
		// 	}
		// });

		return port;
	}
}

new MicroHost();
