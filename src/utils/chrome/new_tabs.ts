function get(tabId: number): Promise<chrome.tabs.Tab | undefined> {
	return new Promise(resolve => {
		chrome.tabs.get(tabId, tab => resolve(tab));
	});
}

function getCurrent(): Promise<chrome.tabs.Tab | undefined> {
	return new Promise(resolve => {
		chrome.tabs.getCurrent(tab => {
			return resolve(tab);
		});
	});
}

function query(queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
	return new Promise(resolve => {
		chrome.tabs.query(queryInfo, tabs => {
			return resolve(tabs);
		});
	});
}

function reload(tabId?: number, reloadProperties?: chrome.tabs.ReloadProperties) {
	return new Promise(resolve => {
		chrome.tabs.reload(tabId as number, reloadProperties, () => {
			resolve();
		});
	});
}

function create(createProperties: chrome.tabs.CreateProperties) {
	return new Promise<chrome.tabs.Tab>(resolve => {
		chrome.tabs.create(createProperties, tab => {
			return resolve(tab);
		});
	});
}

export { get, getCurrent, query, reload, create };

