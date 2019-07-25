import InjectModule from '@/lib/InjectModule';
import RegExpPattern from '@/utils/RegExpPattern';

export default class FixUserDisplay extends InjectModule {
	constructor() {
		super({
			name: 'plugin:fixUserDisplay',
			dependencies: ['AccountShare'],
			run_at: RegExpPattern.videoUrlPattern,
			listener: {
				ajaxrequest: 'replaceAjaxResult',
				xhrrequest: 'replaceXHRResult',
			},
		});

		// @ts-ignore 不知为什么这个初始值会是undefined 嗦以在这里给个假的，后面B站的程序会覆盖
		window.__PGC_LOGININFO__ = {
			vipType: 2,
			vipStatus: 1,
			isLogin: true,
		};
	}

	public replaceAjaxResult({ requestURL }: joybook.InjectHost.AjaxEvent) {
		if (/web-interface\/nav/i.test(requestURL) && !requestURL.includes('joybook')) {
			const transformer = p => p.then((json: bili.NavData) =>
				this.axios.get(`https://api.bilibili.com/x/web-interface/nav?ts=${Date.now()}&joybook=beneficiary`)
					.then(result => result.data)
					.then((info: bili.NavData) => {
						if (!info.data.isLogin) {
							joybook.error('self account isLogin = false');
							return json;
						}
						info.data.vipDueDate = Date.now() + 31536000000;
						info.data.vipType = 2;
						info.data.vipStatus = 1;
						info.data.vip_pay_type = 2;
						joybook.log(json);
						joybook.log(info);
						return info;
					}));
			return transformer;
		} else {
			return;
		}
	}

	// XHR的请求是用来保存在window.__INITIAL_STATE__.loginInfo里的
	// 番剧里写点评会根据loginInfo来评估你是否可以写点评
	// 账号等级超过4级，绑定真实手机号
	public replaceXHRResult({ requestURL, response }: joybook.InjectHost.XHREvent) {
		return new Promise(resolve => {
			if (/web-interface\/nav/i.test(requestURL) && !requestURL.includes('joybook')) {
				this.axios.get(`https://api.bilibili.com/x/web-interface/nav?ts=${Date.now()}&joybook=beneficiary`)
					.then(result => result.data)
					.then((info: bili.NavData) => {
						if (!info.data.isLogin) {
							joybook.error('self account isLogin = false');
							return resolve(response);
						}
						info.data.vipDueDate = Date.now() + 31536000000;
						info.data.vipType = 2;
						info.data.vipStatus = 1;
						info.data.vip_pay_type = 2;
						return resolve(JSON.stringify(info));
					});
			} else {
				return resolve();
			}
		});
	}
}
