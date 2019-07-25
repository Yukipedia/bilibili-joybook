export default class ChromeAsyncTabs {
	public get(tabId: number): Promise<chrome.tabs.Tab | undefined> {
		return new Promise(resolve => {
			chrome.tabs.get(tabId, tab => resolve(tab));
		});
	}

	public getCurrent(): Promise<chrome.tabs.Tab | undefined> {
		return new Promise(resolve => {
			chrome.tabs.getCurrent(tab => {
				return resolve(tab);
			});
		});
	}

	public query(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
		return new Promise(resolve => {
			chrome.tabs.query(queryInfo, tabs => {
				return resolve(tabs);
			});
		});
	}

	public reload(tabId?: number, reloadProperties?: chrome.tabs.ReloadProperties) {
		return new Promise(resolve => {
			chrome.tabs.reload(tabId as number, reloadProperties, () => {
				resolve();
			});
		});
	}

	public create(createProperties: chrome.tabs.CreateProperties) {
		return new Promise<chrome.tabs.Tab>(resolve => {
			chrome.tabs.create(createProperties, tab => {
				return resolve(tab);
			});
		});
	}
}
