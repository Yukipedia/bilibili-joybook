import InjectModule from './InjectModule';

export const enum HostEvent {
	// tslint:disable typedef-whitespace
	DomContentLoaded = 'domcontentloaded',
	AjaxRequest      = 'ajaxrequest',
	XHRRequest       = 'xhrrequest',
	Mutation         = 'mutation',
	PlayerBuffering  = 'playerbuffering',
	PlayerReady      = 'playerready',
	PlayerPlaying    = 'playerplaying',
	PlayerPaused     = 'playerpaused',
	PlayerIdel       = 'playeridel',
	PlayerComplete   = 'playercomplete',
	// tslint:enable typedef-whitespace
}

class InjectHost {
	// Inject环境的模组
	public injectModules: InjectModule[];
	public host: Record<string, any>;

	constructor(modules: Record<string, InjectModule>) {
		this.injectModules = [];
		this.host = {

		};

		this.injectHost();
	}

	public registerModule(module: InjectModule) {
		for (let eventType in module.listener) {
			module.listener[eventType]
		}
	}

	private injectXHR() {
		// tslint:disable object-literal-shorthand only-arrow-functions
		// @ts-ignore
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
							value = function(event) {
								(async function() {
									// responseType如果不是空的或者不是text则不执行
									if (target.readyState === 4 && /^$|text/i.test(target.responseType)) {
										for (const job of jobs.xhr) {
											if (typeof job === 'function') {
												const result = await job(target.responseText, container.requestData, target.responseURL, container.requestMethod);
												if (result) container.responseText = result;
											}
										}
									}
									cb.apply(container.responseText ? receiver : this, arguments);
								})();
							};
						}
						target[prop] = value;
						return true;
					},
					get: function(target: XMLHttpRequest, prop, receiver) {
						// @ts-ignore
						if (prop in container) return container[prop];
						let value = target[prop];

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

	private injectAjax() {
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
				const dispatchResultTransformer = p => p
					.then(r => oriSuccess(r))
					.catch(e => oriError(e));

				for (const job of jobs.ajax) {
					if (typeof job === 'function') {
						const result = job(param, oriResultTransformer);
						if (result) oriResultTransformer = result;
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
					xhr.done = function(success) {
						oriSuccess = success; // 保存外部设置的success函数
						return xhr;
					};
				}
				// 处理替换error
				if (!oriError && myError) {
					xhr.fail(myError);
					xhr.fail = function(error) {
						oriError = error;
						return xhr;
					};
				}
				return xhr;
			};
		}

		if (!window.jQuery) {
			let jQuery;
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

	private injectHost() {

	}
}
