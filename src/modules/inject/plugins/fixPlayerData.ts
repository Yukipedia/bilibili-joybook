import Module, { envContext } from '@/lib/Module';
import RegExpPattern from '@/utils/RegExpPattern';

export default class FixPlayerData extends Module {
	constructor() {
		super({
			name: 'plugin:fixPlayerData',
			context: envContext.inject,
			priority: 1,
			dependencies: ['MXHRR', 'AccountShare'],
			run_at: RegExpPattern.videoUrlPattern,
		});
	}

	public towerResponse(launchPermission, moduleNsp) {
		if (launchPermission) {
			this.launch(moduleNsp);
			confirm(`<Tower Response>: ${this.name}此模块需要刷新当前页面。`) && window.location.reload();
		}
	}

	public launch(moduleNsp) {
		this.main(moduleNsp);
	}

	public main(moduleNsp) {
		moduleNsp.MXHRR.addXHRJob(
			(responseText: string, requestData: string, requestURL: string, requestMethod: string): Promise<string | null> => {
				return new Promise(resolve => {
					// player.so 是新版界面的连接
					if (/player(\.so)?\?id=cid:\d+&aid=\d+$/ig.test(requestURL)) {
						this.axios
							// tslint:disable-next-line triple-equals
							.get(`https://api.bilibili.com/x/player.so?id=cid:${window.cid}&aid=${window.aid}&joybook=beneficiary`)
							.then(result => {
								const currinfo: string[] = result.data.split(/\n/);
								currinfo[15] = `<vip>{"vipType":1,"vipDueDate":${Date.now() + 31536000000},"dueRemark":"","accessStatus":0,"vipStatus":1,"vipStatusWarn":""}</vip>`;
								return resolve(currinfo.join('\n'));
							});
					} else {
						return resolve(null);
					}
				});
			},
		);
		// {"code":0,"message":"success","result":{"area_limit":0,"ban_area_show":1,"follow":1,"pay":1,"pay_pack_paid":0,"progress":{"last_ep_id":250475,"last_ep_index":"16","last_time":1335},"sponsor":0,"vip_info":{"due_date":1616256000000,"status":1,"type":2}}}
		moduleNsp.MXHRR.addXHRJob(
			(responseText: string, requestData: string, requestURL: string, requestMethod: string): Promise<string | null> | void => {
				if (!requestURL.match('pgc/view/web/season/user/status')) return;
				return new Promise(resolve => {
					try {
						const response = JSON.parse(responseText);
						const fakeResponse = {
							code: 0,
							message: 'success',
							result: {},
						};
						for (const key in response.result) {
							!['dialog', 'vip_info'].includes(key) && (fakeResponse.result[key] = response.result[key]);
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
						return resolve(null);
					}
				});
			},
		);
	}
}
