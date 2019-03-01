import Module, { envContext } from '@/lib/Module';
import { waitUntilDomLoaded } from '@/utils/helper';
import RegExpPattern from '@/utils/RegExpPattern';

export default class FixUserDisplay extends Module {
	constructor() {
		super({
			name: 'plugin:fixUserDisplay',
			context: envContext.inject,
			priority: 1,
			run_at: RegExpPattern.videoUrlPattern,
			dependencies: ['MXHRR', 'AccountShare'],
		});
	}

	public towerResponse(launchPermission, moduleNsp) {
		if (launchPermission) {
			this.launch(moduleNsp);
			confirm(`<Tower Response>: ${this.name}此模块需要刷新当前页面。`) && window.location.reload();
		}
	}

	public launch(moduleNsp) {
		// @ts-ignore 不知为什么这个初始值会是undefined 嗦以在这里给个假的，后面B站的程序会覆盖
		window.__PGC_LOGININFO__ = {
			vipType: 2,
			vipStatus: 1,
			isLogin: true,
		};
		this.replaceAjaxResult(moduleNsp);
		this.replaceXHRResult(moduleNsp);
		this.launchComplete();
	}

	public replaceAjaxResult(moduleNsp) {
		moduleNsp.MXHRR.addAjaxJob((param, oriResultTransformer) => {
			if (/web-interface\/nav/i.test(param.url) && !param.url.includes('joybook')) {
				oriResultTransformer = p => p
					.then((json: bili.NavData) => {
						return this.axios.get(`https://api.bilibili.com/x/web-interface/nav?ts=${Date.now()}&joybook=beneficiary`)
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
							});
					});
				return oriResultTransformer;
			}
		});
		this.remindBaipiao();
	}

	// XHR的请求是用来保存在window.__INITIAL_STATE__.loginInfo里的
	// 番剧里写点评会根据loginInfo来评估你是否可以写点评
	// 账号等级超过4级，绑定真实手机号
	public replaceXHRResult(moduleNsp) {
		moduleNsp.MXHRR.addXHRJob((responseText: string, requestData: any, requestURL: string, requestMethod) => {
			if (/web-interface\/nav/i.test(requestURL) && !requestURL.includes('joybook')) {
				return new Promise(resolve => {
					return this.axios.get(`https://api.bilibili.com/x/web-interface/nav?ts=${Date.now()}&joybook=beneficiary`)
					.then(result => result.data)
					.then((info: bili.NavData) => {
						if (!info.data.isLogin) {
							joybook.error('self account isLogin = false');
							return responseText;
						}
						info.data.vipDueDate = Date.now() + 31536000000;
						info.data.vipType = 2;
						info.data.vipStatus = 1;
						info.data.vip_pay_type = 2;
						return resolve(JSON.stringify(info));
					});
				});
			}
			return;
		});
	}

	public async remindBaipiao() {
		const bigVipRed = await waitUntilDomLoaded<HTMLElement>('.vip-type span', false);
		bigVipRed!.innerText = '白嫖的' + bigVipRed.innerText;
		// const clone = bigVipRed.cloneNode(true);
		// const keepExist = () => {
		// 	const label = document.querySelector('.vip-type span') as HTMLElement;
		// 	if (!label) {
		// 		document.querySelector('.vip-type') && document.querySelector('.vip-type')!.appendChild(clone);
		// 	} else if (!label.innerText.includes('白嫖的')) {
		// 		label.innerText = '白嫖的' + label.innerText;
		// 	}
		// 	requestAnimationFrame(keepExist);
		// };
		// requestAnimationFrame(keepExist);
	}

/* 	public async manualReplaceElement() {
		const currUserInfo: bili.NavData = await axios.get(`https://api.bilibili.com/x/web-interface/nav?ts=${Date.now()}&joybook=true`).then(result => result.data);
		if (!currUserInfo.data.isLogin) {
			console.error(currUserInfo, '\nisLogin = false');
			return;
		}
		await waitUntilDomLoaded('.i-face > .face');
		joybook.log('excute: replace face');
		const faceElem = document.querySelector('.i-face > .face');
		faceElem!.setAttribute('src', currUserInfo.data.face.replace(/http:\/\//, 'https://'));

		await waitUntilDomLoaded('.profile-m.dd-bubble');
		joybook.log('excute: replace profile');
		const profile = document.querySelector('.profile-m.dd-bubble');

		const uname = profile!.querySelector('.header-uname > b') as HTMLElement;
		uname!.innerText = currUserInfo.data.uname;

		const coin = profile!.querySelector('.coin .num') as HTMLElement;
		coin!.innerText = `${currUserInfo.data.money}`;

		const coinMove = profile!.querySelector('.coin .num-move') as HTMLElement;
		coinMove!.innerText = `${currUserInfo.data.money + 1}`;

		const bcoin = profile!.querySelector('.currency .num') as HTMLElement;
		bcoin!.innerText = `${currUserInfo.data.wallet.bcoin_balance}`;

		const emailVer = profile!.querySelector('.ver.email') as HTMLElement;
		if (currUserInfo.data.email_verified) {
			emailVer.classList.contains('verified') || emailVer.classList.add('verified');
			(<HTMLElement> emailVer.querySelector('.tips')).innerText = '已绑定';
		} else {
			emailVer.classList.contains('verified') && emailVer.classList.remove('verified');
			(<HTMLElement> emailVer.querySelector('.tips')).innerText = '前去绑定邮箱';
		}

		const phoneVer = profile!.querySelector('.ver.phone') as HTMLElement;
		if (currUserInfo.data.mobile_verified) {
			phoneVer.classList.contains('verified') || phoneVer.classList.add('verified');
			(<HTMLElement> phoneVer.querySelector('.tips')).innerText = '已绑定';
		} else {
			phoneVer.classList.contains('verified') && phoneVer.classList.remove('verified');
			(<HTMLElement> phoneVer.querySelector('.tips')).innerText = '前去绑定手机';
		}

		// level
		const level = profile!.querySelector('.bar > div:first-child') as HTMLElement;
		level.className = `lt lv${currUserInfo.data.level_info.current_level}`;

		const rate = profile!.querySelector('.bar > div.rate') as HTMLElement;
		const { next_exp, current_exp } = currUserInfo.data.level_info;
		rate.style.width = `${100 - Math.ceil( (next_exp - current_exp) / next_exp * 100 )}%`;

		const expNum = profile!.querySelector('.bar > div.num') as HTMLElement;
		expNum!.innerHTML = `<div>${current_exp}<span>/${next_exp}</span></div>`;

		this.remindBaipiao();
	} */
}
