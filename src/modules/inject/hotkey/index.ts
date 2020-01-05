import Module, { envContext } from '@/lib/Module';
import RegExpPattern from '@/utils/RegExpPattern';

export default class Hotkey extends Module {
	constructor() {
		super({
			name: 'Hotkey',
			context: envContext.inject,
			priority: 1,
			storageOptions: {
				area: 'local',
				switch: 'switch.hotkey',
				defaultSwitch: true,
			},
			run_at: RegExpPattern.videoUrlPattern,
		});
	}

	public launch(moduleNsp: any) {
		function rememberLastPlaytime(cid?: number, playtime?: number) {
			let items = localStorage.getItem('joybook_hotkey') || {};
			if (typeof items === 'string') items = JSON.parse(items);
			if (!items[cid || window.cid]) items[cid || window.cid] = {};
			items[cid || window.cid].lastplaytime = playtime || window.player.getCurrentTime();
			localStorage.setItem('joybook_hotkey', JSON.stringify(items));
		}
		function seekToLastPlaytime() {
			let items = localStorage.getItem('joybook_hotkey') || {};
			if (typeof items === 'string') items = JSON.parse(items);
			if (items[window.cid] && items[window.cid].lastplaytime) {
				console.log('seek', items[window.cid].lastplaytime);
				window.player.seek(items[window.cid].lastplaytime);
			}
		}
		function goNext(p?: number) {
			return new Promise(resolve => {
				const walk = () => {
					if (window.player.getState() === 'PLAYING') return setTimeout(resolve, 1e3);
					else return setTimeout(walk, 0);
				};

				window.player.next(p);
				walk();
			});
		}

		moduleNsp.MXHRR.addXHRJob((responseText: string, requestData: any, requestURL: string, requestMethod: string) => {
			if (RegExpPattern.heartbeat.test(requestURL) && +requestData.realtime !== 0) {
				rememberLastPlaytime(+requestData.cid, +requestData.played_time);
				return;
			}
			return;
		});

		document.addEventListener('keydown', event => {
			switch (event.keyCode) {
				// PageUp/PageDown
				case 33:
				case 34:
					const isBangumi = !!window.__INITIAL_STATE__.epList;
					// tslint:disable max-line-length
					// 旧版界面网页全屏player.isFullScreen返回的结果为false
					if (
						(window.player.isFullScreen() || (document.querySelector('#bilibiliPlayer') as HTMLElement).classList.contains('mode-webfullscreen')) &&
						isBangumi ? window.__INITIAL_STATE__.epList.length > 1 : window.__INITIAL_STATE__.videoData.videos > 1
					) {
						const result = event.keyCode === 33 ?
							// 如果是PageUp 检测当前播放的索引是否不等于第一p
							(isBangumi ? Number(window.__INITIAL_STATE__.epInfo.index) > 1 : window.player.getPlaylistIndex() > 0) :
							// 如果是PageDown 检测当前播放嗦以是否不等于最后一P
							(isBangumi ? Number(window.__INITIAL_STATE__.epInfo.index) < window.__INITIAL_STATE__.epList.length : window.player.getPlaylistIndex() + 1 < window.__INITIAL_STATE__.videoData.videos);
						if (!result) return;
						rememberLastPlaytime();

						// player.prev 视频选集栏不会同步
						// 估计是没有改变url的原因 next会改变p=x这个参数
						// window.player.prev();
						if (event.keyCode === 33) {
							goNext(isBangumi ? Number(window.__INITIAL_STATE__.epInfo.index) - 1 : window.player.getPlaylistIndex()).then(seekToLastPlaytime);
						} else {
							goNext(isBangumi ? Number(window.__INITIAL_STATE__.epInfo.index) + 1 : window.player.getPlaylistIndex() + 2).then(seekToLastPlaytime);
						}
					}
					return;

				default:
					return;
			}
		});
	}
}
