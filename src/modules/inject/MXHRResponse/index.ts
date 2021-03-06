import Module, { envContext } from '@/lib/Module';
import { getURLParameters } from '@/utils/helper';

const jobs: {
	ajax: joybook.mxhrr.AjaxJob[],
	xhr: joybook.mxhrr.XhrJob[],
} = {
	ajax: [],
	xhr: [],
};

export default class MXHRR extends Module {
	constructor() {
		super({
			name: 'MXHRR',
			context: envContext.inject,
			priority: 9,
		});
	}

	public launch() {
		Promise.prototype.compose = function(transformer) {
			return transformer ? transformer(this) : this;
		};
		this.injectXHR();
		this.injectAjax();
		this.launchComplete();
		return {
			addXHRJob: (job: joybook.mxhrr.XhrJob) => {
				jobs.xhr.push(job);
			},
			addAjaxJob: (job: joybook.mxhrr.AjaxJob) => {
				jobs.ajax.push(job);
			},
		};
	}

	/**
	 * https://github.com/ipcjs/bilibili-helper/blob/user.js/bilibili_bangumi_area_limit_hack.user.js#L967
	 */
	public injectXHR() {
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
							value = function() {
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

	public injectAjax() {
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
}
