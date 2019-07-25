import InjectModule from '@/lib/InjectModule';
import RegExpPattern from '@/utils/RegExpPattern';

export default class FixPlayerData extends InjectModule {
	constructor() {
		super({
			name: 'plugin:fixPlayerData',
			dependencies: [],
			run_at: RegExpPattern.videoUrlPattern,
			listener: {
				xhrrequest: 'fixPlayerData',
			},
		});
	}

	public fixPlayerData({ requestURL, response }: joybook.InjectHost.XHREvent) {
		return new Promise(resolve => {
			if (/player(\.so)?\?id=cid:\d+&aid=\d+$/ig.test(requestURL)) {
				this.axios
					.get(`https://api.bilibili.com/x/player.so?id=cid:${window.cid}&aid=${window.aid}&joybook=beneficiary`)
					.then(result => {
						const currinfo: string[] = result.data.split(/\n/);
						currinfo[15] = `<vip>{"vipType":1,"vipDueDate":${Date.now() + 31536000000},"dueRemark":"","accessStatus":0,"vipStatus":1,"vipStatusWarn":""}</vip>`;
						return resolve(currinfo.join('\n'));
					});
			} else if (requestURL.includes('pgc/view/web/season/user/status')) {
				try {
					const res = JSON.parse(response);
					const fakeResponse: { [index: string]: any } = {
						code: 0,
						message: 'success',
						result: {},
					};
					for (const key in res.result) {
						!['dialog', 'vip_info'].includes(key) && (fakeResponse.result[key] = res.result[key]);
					}
					// TODO: 添加进bili namespace
					// @ts-ignore
					fakeResponse.result.vip_info = {
						due_date: Date.now() + 31536000000,
						status: 1,
						type: 2,
					};
					return resolve(JSON.stringify(fakeResponse));
				} catch (e) {
					return resolve();
				}
			} else {
				return resolve();
			}
		});
	}
}
