import dotProp from 'dot-prop';
import EventEmitter from 'eventemitter3';

export interface ChromeAsyncStorageArea {
	local: {
		[index: string]: any;
	};
	sync: {
		[index: string]: any;
	};
}

const getChromeStorage = (): Promise<{local: {}, sync: {}}> => {
	return new Promise(resolve => {
		const result = { local: {}, sync: {} };
		chrome.storage.local.get(null, localItems => {
			result.local = localItems;

			chrome.storage.sync.get(null, syncItems => {
				result.sync = syncItems;
				return resolve(result);
			});
		});
	});
};

/**
 * @example 如果想使用这个类 你必须使用以下代码获取实例
 * const storage = await new ChromeStorageAsync();
 * storage.toggle('local', 'dot.prop', 'something')
 */
export default class ChromeAsyncStorage extends EventEmitter {
	private storageArea: ChromeAsyncStorageArea;

	constructor() {
		super();
		this.storageArea = { local: {}, sync: {} };

		// @ts-ignore
		chrome.storage.onChanged.addListener((changes, nsp: 'local' | 'sync') => {
			for (const key in changes) {
				this.storageArea[nsp][key] = changes[key].newValue;
			}
			this.emit('onChanged', this.storageArea);
		});
	}

	public init() {
		// 获取储存的所有项目
		return getChromeStorage()
			.then(result => {
				this.storage.local = result.local;
				this.storage.sync = result.sync;
				this.emit('ready');
			});
	}

	public get storage() {
		return this.storageArea;
	}

	public nativeGet<T>(nsp: keyof ChromeAsyncStorageArea, dotOperate: string, defaultValue?: any) {
		return new Promise<T>(resolve => {
			chrome.storage[nsp].get(null, items => {
				return resolve(dotProp.get(items, dotOperate, defaultValue));
			});
		});
	}

	public get<T>(nsp: keyof ChromeAsyncStorageArea, dotOperate: string, defaultValue?: any): T {
		if (typeof dotOperate === 'undefined') return defaultValue;
		return dotProp.get(this.storage[nsp], dotOperate, defaultValue);
	}

	public set(nsp: keyof ChromeAsyncStorageArea, items: object): Promise<{}>;
	public set(nsp: keyof ChromeAsyncStorageArea, items: string, dotPropValue: any): Promise<boolean>;
	public set(nsp: keyof ChromeAsyncStorageArea, items: object | string, dotPropValue?: any): Promise<boolean> {
		return this.setStorage(nsp, items, dotPropValue);
	}

	public remove(nsp: keyof ChromeAsyncStorageArea, key: string | string[]) {
		return new Promise(resolve => {
			if (!Array.isArray(key) && key.includes('.')) {
				dotProp.delete(this.storage[nsp], key);
				this.setStorage(nsp, this.storage[nsp])
					.then(() => resolve());
			} else {
				chrome.storage[nsp].remove(key, () => {
					return resolve();
				});
			}
		});
	}

	public toggle(nsp: keyof ChromeAsyncStorageArea, dotOperate: string) {
		return this.setToggle(nsp, dotOperate);
	}

	private setToggle(nsp: keyof ChromeAsyncStorageArea, dotOperate: string) {
		return new Promise((resolve, reject) => {
			const toggleValue = this.get(nsp, dotOperate);
			if (
				typeof toggleValue === 'boolean' ||
				(typeof toggleValue === 'string' && (toggleValue === 'true' || toggleValue === 'false'))
			) {
				const toggleTo = typeof toggleValue === 'boolean' ? !toggleValue : ( toggleValue === 'false' ? true : false );
				return this.set(nsp, dotOperate, toggleTo)
					.then(() => resolve(toggleTo));
			}
			return reject();
		});
	}

	private setStorage(nsp: keyof ChromeAsyncStorageArea, items: object | string, dotPropValue?: any) {
		return new Promise<boolean>((resolve, reject) => {
			const isDotProp = typeof items === 'string';
			if (isDotProp) {
				dotProp.set(this.storage[nsp], items as string, dotPropValue);
			}
			chrome.storage[nsp].set(isDotProp ? this.storage[nsp] : items, () => {
				if (chrome.runtime.lastError) {
					const lastError = chrome.runtime.lastError;
					chrome.runtime.lastError = undefined;
					return reject(lastError);
				}
				return resolve(true);
			});
		});
	}
}
