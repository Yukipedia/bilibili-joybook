import Module, { envContext } from '@/lib/Module';
import RegExpPattern from '@/utils/RegExpPattern';
import AVBlockerConfig from '@/modules/inject/avblocker/config';

export default class AddToBlocklist extends Module {
	public tips: HTMLElement;

	constructor() {
		super({
			name: 'plugin:addToBlocklist',
			context: envContext.inject,
			priority: 1,
			// 不管有没有开启都显示这些按钮
			/*dependencies: ['AVBlocker'], */
			run_at: [RegExpPattern.videoUrlPattern, RegExpPattern.accountSpace, RegExpPattern.homeUrlPattern],
		});
		this.tips = null as any;
	}

	public launch(moduleNsp) {
		document.addEventListener('DOMContentLoaded', () => {
			if (RegExpPattern.homeUrlPattern.test(window.location.href)) {
				this.homepage();
			} else if (RegExpPattern.videoUrlPattern.test(window.location.href)) {
				this.videopage();
			} else if (RegExpPattern.accountSpace.test(window.location.href)) {
				this.userSpace(moduleNsp);
			}
		});

		this.injectstyle();
	}

	public registerMutation(
		node: Element,
		callback: (mutationList: MutationRecord[]) => void,
		init: MutationObserverInit = {
			attributes: true,
			childList: true,
			subtree: true,
		},
	) {
		new MutationObserver(callback).observe(node, init);
	}

	public sendMessage<T>(callback: (response: T) => void) {
		chrome.runtime.sendMessage(
			window.joybook.id,
			{
				name: 'serve',
				cmd: 'get:storage',
				payload: [AVBlockerConfig.storageOptions.area, AVBlockerConfig.storageOptions.location],
			},
			callback,
		);
	}

	public ensureAidExist() {
		return new Promise(resolve => {
			const walk = () => {
				if (typeof window.aid !== 'undefined') resolve();
				else setTimeout(walk, 100);
			};
			walk();
		});
	}

	public createBtn(style: 'stardustvideo' | 'stardustbangumi' | 'video' | 'bangumi') {
		if (style === 'stardustvideo') {
			const wrap = document.createElement('span');
			wrap.title = '屏蔽';
			wrap.className = 'block';
			const icon = document.createElement('i');
			icon.className = 'van-icon-videodetails_block';
			wrap.appendChild(icon);
			wrap.insertAdjacentText('beforeend', '屏蔽');
			return { wrap, icon };
		} else if (style === 'stardustbangumi') {
			const wrap = document.createElement('div');
			wrap.className = 'btn-block';
			const icon = document.createElement('i');
			icon.className = 'iconfont icon-block';
			const text = document.createElement('span');
			text.innerText = '屏蔽';
			wrap.appendChild(icon);
			wrap.appendChild(text);
			return { wrap, icon, text };
		} else {
			const wrap = document.createElement('div');
			wrap.className = 'joybook-addToBlocklist-wrap';
			const icon = document.createElement('i');
			icon.className = 'joybook-addToBlocklist';
			const text = document.createElement('span');
			text.className = 'joybook-addToBlocklist-status';
			text.innerText = '添加到屏蔽列表';
			wrap.appendChild(icon);
			wrap.appendChild(text);
			return { wrap, icon, text };
		}
	}

	public homepage() {
		// normal & special-recommend-module
		new MutationObserver(mutationList => {
			for (const mutation of mutationList) {
				if (
					mutation.type === 'childList' &&
					mutation.addedNodes.length > 0 &&
					// @ts-ignore
					mutation.target.className === 'storey-box clearfix'
				) {
					mutation.addedNodes.forEach(elem => {
						// @ts-ignore
						if (elem.className === 'spread-module') {
							// @ts-ignore
							const anchor = elem.querySelector('a > div.pic');
							anchor && anchor.appendChild(this.addToBlocklistBtn());
							// @ts-ignore
						} else if (elem.className === 'special-module special') {
							// @ts-ignore
							const anchor = elem.querySelector('a.pic > div.pic-box');
							anchor && anchor.appendChild(this.addToBlocklistBtn());
						}
					});
				}
			}
		}).observe(document.querySelector('#app')!, {
			childList: true,
			subtree: true,
		});

		// recommend-module
		// 推荐模块是服务器渲染的嗦以MutationObserver没办法检测到
		try {
			const recommendModule = document.body.querySelector('.recommend-module')!;
			const nodelist = recommendModule.querySelectorAll('.groom-module');
			for (const node of nodelist) {
				node.appendChild(this.addToBlocklistBtn());
			}
		} catch (e) { console.log(e); }
	}

	public videopage() {
		if (document.querySelector('#arc_toolbar_report')) /* stardustVideo */ {
			const { wrap, icon } = this.createBtn('stardustvideo');
			this.sendMessage<joybook.avblocker.FullBlockList>(response => {
				this.ensureAidExist().then(() => {
					if (response.global.aid.includes(+window.aid)) wrap.classList.add('on');
					wrap.addEventListener('click', () => {
						if (wrap.classList.contains('on')) {
							this.removeFromBlocklist('aid', +window.aid);
							wrap.classList.remove('on');
						} else {
							this.addToBlocklist('aid', +window.aid);
							wrap.classList.add('on');
						}
					});
				});
			});
			const callback = (mutationList: MutationRecord[]) => {
				for (const mutation of mutationList) {
					if (
						mutation.type === 'attributes' &&
						mutation.attributeName === 'title' &&
						['like', 'coin', 'collect'].indexOf((mutation.target as HTMLElement).className.split(/\s/)[0]) !== -1
					) {
						const ops = document.querySelector('#arc_toolbar_report .ops')!;
						ops.insertBefore(wrap, ops.querySelector('.share'));
					}
				}
			};
			this.registerMutation(document.querySelector('#arc_toolbar_report .ops')!, callback);
		} else if (document.querySelector('#media_module')) /* stardustBangumi */ {
			const { wrap, icon, text } = this.createBtn('stardustbangumi');
			this.sendMessage<joybook.avblocker.FullBlockList>(response => {
				this.ensureAidExist().then(() => {
					if (response.global.aid.includes(+window.aid)) wrap.classList.add('active');
					wrap.addEventListener('click', () => {
						if (wrap.classList.contains('active')) {
							this.removeFromBlocklist('aid', +window.aid);
							wrap.classList.remove('active');
							text && (text.innerText = '屏蔽');
						} else {
							this.addToBlocklist('aid', +window.aid);
							wrap.classList.add('active');
							text && (text.innerText = '已屏蔽');
						}
					});
					wrap.addEventListener('mouseover', () => {
						if (wrap.classList.contains('active')) {
							text && (text.innerText = '移除屏蔽');
						}
					});
					wrap.addEventListener('mouseout', () => {
						if (wrap.classList.contains('active')) {
							text && (text.innerText = '已屏蔽');
						}
					});
				});
			});
			const toolbar = document.querySelector('.media-tool-bar')!;
			const callback = (mutationList: MutationRecord[]) => {
				for (const mutation of mutationList) {
					if (
						mutation.type === 'attributes' &&
						mutation.attributeName === 'report-id'
					) {
						toolbar.insertBefore(wrap, toolbar.querySelector('.btn-follow'));
					}
				}
			};
			this.registerMutation(toolbar, callback);
		} else {
			const { wrap, icon, text } = this.createBtn('video');
			this.sendMessage<joybook.avblocker.FullBlockList>(response => {
				this.ensureAidExist()
					.then(() => {
						if (response.global.aid.includes(+window.aid)) icon.classList.add('added');
						if (icon.classList.contains('added')) text && (text.innerText = '从屏蔽列表移除');
						icon.addEventListener('click', ev => {
							if (icon.classList.contains('added')) {
								this.removeFromBlocklist('aid', +window.aid);
								icon.classList.remove('added');
								text && (text.innerText = '添加到屏蔽列表');
							} else {
								this.addToBlocklist('aid', +window.aid);
								icon.classList.add('added');
								text && (text.innerText = '从屏蔽列表移除');
							}
						});
					});
			});
			const callback = (mutationList: MutationRecord[]) => {
				for (const mutation of mutationList) {
					if (
						mutation.type === 'attributes' &&
						mutation.attributeName === 'title' &&
						(mutation.target as HTMLElement).getAttribute('report-id')
					) {
						try {
							document.querySelector('.header-info .count-wrapper')!.appendChild(wrap);
						} catch (e) {
							document.querySelector('.video-info-m div.number')!.appendChild(wrap);
						}
					}
				}
			};
			try {
				this.registerMutation(document.querySelector('#bangumi_header .header-info .count-wrapper')!, callback);
			} catch (e) {
				this.registerMutation(document.querySelector('#viewbox_report .number')!, callback);
			}
		}
	}

	public userSpace(moduleNsp) {
		moduleNsp.MXHRR.addXHRJob((responseText: string, requestData: Record<string, string>, requestURL: string, requestMethod: string) => {
			return new Promise(resolve => {
				if (/\/x\/relation\/modify/i.test(requestURL)) {
					chrome.runtime.sendMessage(
						window.joybook.id,
						{
							name: 'serve',
							cmd: 'get:storage',
							payload: [AVBlockerConfig.storageOptions.area, AVBlockerConfig.storageOptions.location],
						},
						(response: joybook.avblocker.FullBlockList) => {
							if (response.global.concatBlacklist) {
								const response = JSON.parse(responseText);
								if (response.code === 0 && requestData.act === '5') {
									this.addToBlocklist('owner', window.mid);
								} else if (response.code === 0 && requestData.act === '6') {
									this.removeFromBlocklist('owner', window.mid);
								}

							}
							return resolve();
						},
					);
				} else {
					return resolve();
				}
			});
		});

		chrome.runtime.sendMessage(
			window.joybook.id,
			{
				name: 'serve',
				cmd: 'get:storage',
				payload: [AVBlockerConfig.storageOptions.area, AVBlockerConfig.storageOptions.location],
			},
			(response: joybook.avblocker.FullBlockList) => {
				const listitem = document.createElement('li');
				listitem.classList.add('be-dropdown-item');
				if (response.global.owner.includes(window.mid)) listitem.classList.add('added');
				listitem.innerText = listitem.classList.contains('added') ? '从屏蔽列表移除' : '添加到屏蔽列表';

				listitem.addEventListener('click', () => {
					if (listitem.classList.contains('added')) {
						listitem.classList.remove('added');
						this.removeFromBlocklist('owner', window.mid);
						listitem.innerText = '添加到屏蔽列表';
					} else {
						listitem.classList.add('added');
						this.addToBlocklist('owner', window.mid);
						listitem.innerText = '从屏蔽列表移除';
					}
				});

				const menu = document.querySelector('.be-dropdown.h-add-to-black .be-dropdown-menu');
				menu && menu.insertBefore(listitem, menu.firstChild);
			},
		);
	}

	public addToBlocklistBtn() {
		if (!this.tips) {
			this.tips = document.createElement('div');
			this.tips.className = 'add-to-blocklist-hint';
			this.tips.innerText = '添加到屏蔽列表';
		}
		const addToBlocklist = document.createElement('div');
		addToBlocklist.className = 'add-to-blocklist-trigger a-blocklist';

		addToBlocklist.addEventListener('mouseover', ev => {
			const rect = ev.srcElement ? ev.srcElement.getBoundingClientRect() : null;
			const added = ev.srcElement ? ev.srcElement.classList.contains('added') : false;
			if (rect) {
				this.tips.style.top = `${rect.top + document.documentElement.scrollTop - 30}px`;
				this.tips.style.left = `${rect.left - 39}px`;
				this.tips.style.display = 'block';
				if (added) {
					this.tips.style.left = `${rect.left - 9}px`;
					this.tips.innerText = '移除';
				} else {
					this.tips.style.left = `${rect.left - 39}px`;
					this.tips.innerText = '添加到屏蔽列表';
				}
				document.body.appendChild(this.tips);
			}
		});
		addToBlocklist.addEventListener('mouseout', () => {
			// 添加到屏蔽列表后，如果再次点击这个按钮就会移除tips
			// 这时候如果mouseout触发，因为已经移除了tips嗦以这里会报错
			try {
				document.body.removeChild(this.tips);
			} catch (e) { null; }
		});
		addToBlocklist.addEventListener('click', ev => {
			ev.stopPropagation();
			ev.preventDefault();
			const rect = ev.srcElement ? ev.srcElement.getBoundingClientRect() : null;
			const added = ev.srcElement ? ev.srcElement.classList.contains('added') : false;
			if (rect && ev.srcElement && ev.srcElement.parentElement) {
				const linkElem = ev.srcElement.parentElement.querySelector('a') || ev.srcElement.parentElement.parentElement;
				if (!linkElem || linkElem.nodeName !== 'A') return;
				const aid = linkElem.getAttribute('href')!.split('/')[2].replace(/av/i, '');
				if (added) {
					this.tips.style.left = `${rect.left - 39}px`;
					this.tips.innerText = '添加到屏蔽列表';
					ev.srcElement.classList.remove('added');
					this.removeFromBlocklist('aid', +aid);
				} else {
					ev.srcElement.classList.add('added');
					this.tips.style.left = `${rect.left - 9}px`;
					this.tips.innerText = '移除';
					this.addToBlocklist('aid', +aid);
				}
			}
		});

		return addToBlocklist;
	}

	public addToBlocklist(section: 'aid' | 'owner', value: number) {
		const { storageOptions } = AVBlockerConfig;
		const { area, location } = storageOptions;
		chrome.runtime.sendMessage(
			window.joybook.id,
			{
				name: 'serve',
				cmd: 'get:storage',
				payload: [area, `${location}.global.${section}`],
			},
			(response: number[]) => {
				const index = response.indexOf(value);
				if (index !== -1) return;
				chrome.runtime.sendMessage(
					window.joybook.id,
					{
						name: 'serve',
						cmd: 'set:storage',
						payload: [area, `${location}.global.${section}`, response.concat(value)],
					},
				);
			},
		);
	}

	public removeFromBlocklist(section: 'aid' | 'owner', value: number) {
		const { storageOptions } = AVBlockerConfig;
		const { area, location } = storageOptions;
		chrome.runtime.sendMessage(
			window.joybook.id,
			{
				name: 'serve',
				cmd: 'get:storage',
				payload: [area, `${location}.global.${section}`],
			},
			(response: number[]) => {
				const existed = response.indexOf(value);
				if (existed >= 0) {
					response.splice(existed, 1);
					chrome.runtime.sendMessage(
						window.joybook.id,
						{
							name: 'serve',
							cmd: 'set:storage',
							payload: [area, `${location}.global.${section}`, response],
						},
					);
				}
			},
		);
	}

	public injectstyle() {
		// tslint:disable max-line-length
		const visibility = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDBWMHoiLz48cGF0aCBvcGFjaXR5PSIuMyIgZD0iTTEyIDZjLTMuNzkgMC03LjE3IDIuMTMtOC44MiA1LjVDNC44MyAxNC44NyA4LjIxIDE3IDEyIDE3czcuMTctMi4xMyA4LjgyLTUuNUMxOS4xNyA4LjEzIDE1Ljc5IDYgMTIgNnptMCAxMGMtMi40OCAwLTQuNS0yLjAyLTQuNS00LjVTOS41MiA3IDEyIDdzNC41IDIuMDIgNC41IDQuNVMxNC40OCAxNiAxMiAxNnoiLz48cGF0aCBkPSJNMTIgNEM3IDQgMi43MyA3LjExIDEgMTEuNSAyLjczIDE1Ljg5IDcgMTkgMTIgMTlzOS4yNy0zLjExIDExLTcuNUMyMS4yNyA3LjExIDE3IDQgMTIgNHptMCAxM2MtMy43OSAwLTcuMTctMi4xMy04LjgyLTUuNUM0LjgzIDguMTMgOC4yMSA2IDEyIDZzNy4xNyAyLjEzIDguODIgNS41QzE5LjE3IDE0Ljg3IDE1Ljc5IDE3IDEyIDE3em0wLTEwYy0yLjQ4IDAtNC41IDIuMDItNC41IDQuNVM5LjUyIDE2IDEyIDE2czQuNS0yLjAyIDQuNS00LjVTMTQuNDggNyAxMiA3em0wIDdjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41UzEwLjYyIDkgMTIgOXMyLjUgMS4xMiAyLjUgMi41UzEzLjM4IDE0IDEyIDE0eiIvPjwvc3ZnPg==';
		const visibilityOff = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJub25lIiBkPSJNMCAwaDI0djI0SDBWMHptMCAwaDI0djI0SDBWMHptMCAwaDI0djI0SDBWMHptMCAwaDI0djI0SDBWMHoiLz48cGF0aCBvcGFjaXR5PSIuMyIgZD0iTTEyIDE0Yy4wNCAwIC4wOC0uMDEuMTItLjAxbC0yLjYxLTIuNjFjMCAuMDQtLjAxLjA4LS4wMS4xMiAwIDEuMzggMS4xMiAyLjUgMi41IDIuNXptMS4wMS00Ljc5bDEuMjggMS4yOGMtLjI2LS41Ny0uNzEtMS4wMy0xLjI4LTEuMjh6bTcuODEgMi4yOUMxOS4xNyA4LjEzIDE1Ljc5IDYgMTIgNmMtLjY4IDAtMS4zNC4wOS0xLjk5LjIybC45Mi45MmMuMzUtLjA5LjctLjE0IDEuMDctLjE0IDIuNDggMCA0LjUgMi4wMiA0LjUgNC41IDAgLjM3LS4wNi43Mi0uMTQgMS4wN2wyLjA1IDIuMDVjLjk4LS44NiAxLjgxLTEuOTEgMi40MS0zLjEyek0xMiAxN2MuOTUgMCAxLjg3LS4xMyAyLjc1LS4zOWwtLjk4LS45OGMtLjU0LjI0LTEuMTQuMzctMS43Ny4zNy0yLjQ4IDAtNC41LTIuMDItNC41LTQuNSAwLS42My4xMy0xLjIzLjM2LTEuNzdMNi4xMSA3Ljk3Yy0xLjIyLjkxLTIuMjMgMi4xLTIuOTMgMy41MkM0LjgzIDE0Ljg2IDguMjEgMTcgMTIgMTd6Ii8+PHBhdGggZD0iTTEyIDZjMy43OSAwIDcuMTcgMi4xMyA4LjgyIDUuNS0uNTkgMS4yMi0xLjQyIDIuMjctMi40MSAzLjEybDEuNDEgMS40MWMxLjM5LTEuMjMgMi40OS0yLjc3IDMuMTgtNC41M0MyMS4yNyA3LjExIDE3IDQgMTIgNGMtMS4yNyAwLTIuNDkuMi0zLjY0LjU3bDEuNjUgMS42NUMxMC42NiA2LjA5IDExLjMyIDYgMTIgNnptMi4yOCA0LjQ5bDIuMDcgMi4wN2MuMDgtLjM0LjE0LS43LjE0LTEuMDdDMTYuNSA5LjAxIDE0LjQ4IDcgMTIgN2MtLjM3IDAtLjcyLjA2LTEuMDcuMTRMMTMgOS4yMWMuNTguMjUgMS4wMy43MSAxLjI4IDEuMjh6TTIuMDEgMy44N2wyLjY4IDIuNjhDMy4wNiA3LjgzIDEuNzcgOS41MyAxIDExLjUgMi43MyAxNS44OSA3IDE5IDEyIDE5YzEuNTIgMCAyLjk4LS4yOSA0LjMyLS44MmwzLjQyIDMuNDIgMS40MS0xLjQxTDMuNDIgMi40NSAyLjAxIDMuODd6bTcuNSA3LjVsMi42MSAyLjYxYy0uMDQuMDEtLjA4LjAyLS4xMi4wMi0xLjM4IDAtMi41LTEuMTItMi41LTIuNSAwLS4wNS4wMS0uMDguMDEtLjEzem0tMy40LTMuNGwxLjc1IDEuNzVjLS4yMy41NS0uMzYgMS4xNS0uMzYgMS43OCAwIDIuNDggMi4wMiA0LjUgNC41IDQuNS42MyAwIDEuMjMtLjEzIDEuNzctLjM2bC45OC45OGMtLjg4LjI0LTEuOC4zOC0yLjc1LjM4LTMuNzkgMC03LjE3LTIuMTMtOC44Mi01LjUuNy0xLjQzIDEuNzItMi42MSAyLjkzLTMuNTN6Ii8+PC9zdmc+';
		const visibility64px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAACXBIWXMAAC4jAAAuIwF4pT92AAAF+mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTAyLTE4VDIwOjQ0OjMyKzA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE5LTAyLTE4VDIwOjQ0OjMyKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOS0wMi0xOFQyMDo0NDozMiswODowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDplMjhkNmZlYy0yMTBlLTI1NGYtYWZmNi0yZDQyZWU2NTllNjAiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo0MWMwMDhiNS02MWFkLTJlNDctYmY4YS01NzY1NjgwZWUwMzUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5YWYxZTRlMy0wMTIxLTcwNGEtOTA4Ni05MGJlMzZkODE2NTYiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjlhZjFlNGUzLTAxMjEtNzA0YS05MDg2LTkwYmUzNmQ4MTY1NiIgc3RFdnQ6d2hlbj0iMjAxOS0wMi0xOFQyMDo0NDozMiswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDplMjhkNmZlYy0yMTBlLTI1NGYtYWZmNi0yZDQyZWU2NTllNjAiIHN0RXZ0OndoZW49IjIwMTktMDItMThUMjA6NDQ6MzIrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6PKUBtAAABO0lEQVRo3u3XsU7CUBSH8Y+HcJXE96kwMDHLxOYDMIhxZtKEhYnBh2AlOPoakLC5mEBd/k1uDOriQMPX5Cyn55Lz6z0tLXVdc0mBYMGCBQsWLFiwYMGCBQsWLFiwYMGCLwj8y3EDTIAVsAUOiW1yk9ScPNoE7gKvwBGo/4hjarttBQ+Aj2AO2ckHYAQME6PkVqmps2bQNvC42Lk1cAdUwD2wAT4Tm+Sq1KyLdeO2gHvFbi2A24AefxjtY85VqV0UU9E7d/AVsEvDyyCqjG8z3nPgOjEvxnhY1C+T3wFX5wyepdF3oF8AnpJ/AzrF6HeSq1PT1PfzGzUwO2fwPk1Oi+Yr4Llp/sSTvLlIL9/WTJPfu8Pewz6l/R/2Tct3ab+W/B4WLFiwYMGCBQsWLFiwYMGCBQsWLFiw4P+PL3gf1d4A9MapAAAAAElFTkSuQmCC';
		const visibilityOff64px = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAACXBIWXMAAC4jAAAuIwF4pT92AAAF+mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTAyLTE4VDIwOjQ2OjMyKzA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE5LTAyLTE4VDIwOjQ2OjMyKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOS0wMi0xOFQyMDo0NjozMiswODowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0NDhiYTI4ZC0zYjUyLTMwNDEtYjM1NC00Mjk2OGRlNzc5OTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo5YzAwN2VmZS1hYjhmLTkxNDMtODA0Yy1jZWY4OTc4MTIyZmMiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo1NGM5N2Q4Mi0wYWUzLTFkNGYtOGIyNi1iNTY1MTFkMTRmYzkiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjU0Yzk3ZDgyLTBhZTMtMWQ0Zi04YjI2LWI1NjUxMWQxNGZjOSIgc3RFdnQ6d2hlbj0iMjAxOS0wMi0xOFQyMDo0NjozMiswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo0NDhiYTI4ZC0zYjUyLTMwNDEtYjM1NC00Mjk2OGRlNzc5OTgiIHN0RXZ0OndoZW49IjIwMTktMDItMThUMjA6NDY6MzIrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4hb3MLAAAB6UlEQVRo3u2Yu0oDURCG1wsWYmst5C18BSHRIogu2Gmh6bTRRiReCNpEvLQxYoS8gRYRtAhWavAB7BOJlU1gE+fgHxiW3bUROcf8A18znF3m48y57Hq9Xs8bJDwKU5jCFKYwhSlMYQpTmMIUpjCFKUxhClNYv+w7xoQl7xfDduFrU6NQGBThVQiHpWeEmtAUAtBEbltIuSocJz0u3Kl8mK5QFaZcFDZxESM9LywIvrAi5DHLAcZ+ClnXhNciZrCgNrUboSM8ChtCWlgW6mp8zhXhWTVbZeHoh/Y2rbwH6YxQQj7Au6wWnhTeUfAVJAzHMdKXqo19Nb6CfMu802bhExT6IswpgYOY9h4VbpHbV+PNsw3kizYLt1HkrirecI78W0J7n4WeyWNc22bhIopsxMzwk3CYsHvrGX7GmFPb13ALhVaUgI912sNZW4qQHhGmMb7cn13b13B4ly5h501jJ+7GXDq09KbKZ1w5h3Oq6DrOWCO9jrO3Axox7V3Dbc2pm1ZWtXEAiTxuV766ad1HSA+7eLX0cC+uJrRyUns7KdyPFL6I9NeSeeBDeBB2hK04aReFwzEEwhH5afkfhJOiL/0qTAyCsIlFnOl2zzD/WlKYwhSmMIUpTGEKU5jCFKYwhSlMYQpT+A/4AkAgmtmcyBs7AAAAAElFTkSuQmCC';
		const visibilityTrigger = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF+mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTAyLTE0VDAxOjM5OjU4KzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOS0wMi0xNFQwMTo0NDo0NiswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOS0wMi0xNFQwMTo0NDo0NiswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDplMWEwZDJmNC01ZjNmLTQ5NGItYjRjMy00ZmI2NDJiM2QxYTkiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo1NjdmMWMwMC1kNGI1LWVkNDItYThkMi1hMWRiMTljNjVjNmIiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3MGVkZjAzNi02YWNjLTU5NDktYjM3ZS01OTdlMDkxYjM5NmUiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjcwZWRmMDM2LTZhY2MtNTk0OS1iMzdlLTU5N2UwOTFiMzk2ZSIgc3RFdnQ6d2hlbj0iMjAxOS0wMi0xNFQwMTozOTo1OCswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDplMWEwZDJmNC01ZjNmLTQ5NGItYjRjMy00ZmI2NDJiM2QxYTkiIHN0RXZ0OndoZW49IjIwMTktMDItMTRUMDE6NDQ6NDYrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5i0/cZAAACLUlEQVQ4y7WVzYvxURTHkVhQw4KysDFNzY5YSFkpY89Smn/AZmr2tmSBDXlZsJuNjTKThdnMjFKivC9GyUqJhKZM+D7uiV/mmZcH8zh1Fvfcez7n3u+53cvjrS2ZTOrWnlv7+9pxpL9vGDreDvTtF8C//Y3gmyp4eHjAeDzGscZyGWMDz/G2x/8NdBe+lYW3PcLW2u026vX6h4TVarUXeD6fc5J8At/e3mItPYrFIo1HoxFSqRQCgQCCwSAymQwGg8Hh4MlkAofDAT6fj3K5TLHz83MqtutOp/OTfD+CmT0/P3OAarVKsVAoBJfLhXA4zJ1KKpXi6elpPzCTgCXZbDYYjUaIxWI0m03S+eLiAiqVCoVCAS8vL1Cr1bSWzf8IZnoqlUooFAq0Wi3ajVAopOTX11daI5PJuDHbxNnZGTQaDabT6fdgv99PSYlEAp1OB3d3d1REIpFQnMWY6XQ6eL1edLtdRCIRmmPN/RZcqVQ4GVhSPp+HSCSC2WyGxWKBQCDgdn5/f0+9uLq6ohzW6B81puB6IWtUv9+Hz+ej8e7NqNVqtPbm5obGsVhsv1vh8XgoQa/XI5fLIRqNwmq1wu12Q6vV0lypVEKv16O7vfd1Y5ZOp7lGsYaaTCbY7XbI5XJu541G47B7vLXlcol4PE6yMLDBYMD19TUVZboz+OPj4+Hgf9nl5SXBZ7PZ/wUPh0Nks1ksFosvwSd7Nj889KzqMf7VQ3+ar+lUn+kfQbfFKk1lkuwAAAAASUVORK5CYII=';
		const style = document.createElement('style');
		style.innerText = `
			.video-info-m .number .fav {
				margin-right: 5px;
			}
			.video-info-m .joybook-addToBlocklist {
				position: relative;
				top: 0;
				width: 45px;
				line-height: 28px;
				vertical-align: middle;
				margin-top: 3px;
				margin-right: 3px;
				margin-left: 0;
			}
			.video-info-m .joybook-addToBlocklist-status {
				margin-left: 0;
			}
			.joybook-addToBlocklist-wrap {
				display: inline-block;
				margin-right: 30px;
			}
			.joybook-addToBlocklist {
				display: inline-block;
				position: absolute;
				margin-left: 4px;
				top: -20px;
				width: 60px;
				height: 60px;
				line-height: 28px;
				vertical-align: middle;
				cursor: pointer;
				background-image: url(${visibility64px});
				background-repeat: no-repeat;
			}
			.joybook-addToBlocklist.added {
				background-image: url(${visibilityOff64px});
			}
			.joybook-addToBlocklist-status {
				position: relative;
				margin-left: 55px;
				padding: 0 3px;
			}
			.add-to-blocklist-trigger {
				display: none;
				width: 22px;
				height: 22px;
				position: absolute;
				right: 32px;
				bottom: 4px;
				cursor: pointer;
				background-image: url(${visibilityTrigger});
				background-repeat: no-repeat;
			}
			.add-to-blocklist-trigger.added {
				background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAABiklEQVQ4jbXVzyvDcRzH8efns1+JIRtbOSiKrMRBrZZC5IzcHJYTJyc1J464ubuY5MQ/oLSTNSHfIg5KyEmbzY/5sa++c/hOCtv47rvX8f2pR+/3u0+fjwAgfNoFLAH9gA1jUYEIECLoU0QOjQIVBsHveQECEr1Ts1By1pJEH9/s9EuM77RQbLIMKACG4QaHhYNBL7EBj3lwtU2yFXDT6rRil8Ic2C4F634XnbU24m8aY9F46bAUsNJdR1+9g6f3LKPROBfp99LhxY5aRhorULUs43sJlFQmfxO/FWMDHpQhL+3VXzdxps3JVEsVAJOHSSK3rwWbsP5WtAhorrSy09vAxH6CeoeFOV8NALPHKTZvnovMBoLwafZ7sc4uWfe76HE70HKnUsDy+SNzJ/dFUciziruMxvBunNXLNFLo6Mb1M/N/RCHPKgAyWpbpoyQHdxmaKi0snD3wYzQj8GfWrtL/4L5S1rdCLYOrSvTvxOxEJBBC/07MygsQkgR9ChAAtiltLWrOCBD0KR9smmovo1v+1QAAAABJRU5ErkJggg==)
			}
			.add-to-blocklist-hint {
				position: absolute;
				font-size: 12px;
				color: #fff;
				border-radius: 4px;
				line-height: 18px;
				padding: 4px 8px;
				z-index: 99999;
				background-color: #000;
				background: rgba(0,0,0,.8);
			}
			.bangumi-module .add-to-blocklist-trigger {
				right: 6px;
			}
			.groom-module:hover .a-blocklist,
			.spread-module .pic:hover .a-blocklist {
				display: block;
			}
			.van-icon-videodetails_block {
				background-image: url(${visibility});
				background-repeat: no-repeat;
				background-position: center center;
			}
			#arc_toolbar_report .ops .block.on .van-icon-videodetails_block {
				background-image: url(${visibilityOff});
			}

			.main-container .media-info .media-right .media-tool-bar .btn-block {
				float: left;
				width: 72px;
				height: 32px;
				text-align: center;
				background-color: #680818;
				color: #fff;
				border-radius: 2px;
				cursor: pointer;
				-webkit-transition: all .3s ease;
				-o-transition: all .3s ease;
				transition: all .3s ease;
				font-size: 14px;
				margin-right: 12px;
			}
			.main-container .media-info .media-right .media-tool-bar .btn-block.active {
				background-color: #e7e7e7!important;
				color: #999;
			}
			.main-container .media-info .media-right .media-tool-bar .btn-block i {
				display: inline-block;
				vertical-align: top;
				width: 22px;
				height: 22px;
				line-height: 22px;
				margin-top: 5px;
				margin-right: 9px;
				color: #fff;
				font-size: 16px;
				filter: contrast(4) invert(1);
				background-image: url(${visibilityOff});
				background-position: center center;
				background-repeat: no-repeat;
			}
			.main-container .media-info .media-right .media-tool-bar .btn-block.active i {
				display: none;
			}
			.main-container .media-info .media-right .media-tool-bar .btn-block span {
				display: inline-block;
				vertical-align: top;
				height: 32px;
				line-height: 32px;
				font-size: 14px;
			}
		`;
		(document.head! || document.documentElement!).appendChild(style);
	}
}
