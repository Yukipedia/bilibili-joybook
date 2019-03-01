function parseCookie<T>(str: string): T {
	return str
	.split(';')
	.map(v => v.split('='))
	.reduce<any>((acc: { [index: string]: string }, v) => {
		acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
		return acc;
	}, {});
}

export const serializeCookie = (name: string, val: string) => `${encodeURIComponent(name)}=${encodeURIComponent(val)}`;

export const sleep = (time: number = 1) => {
	return new Promise(resolve => {
		setTimeout(resolve, 1000 * time);
	});
};

function waitUntilDomConditionLoaded(
	condition: (mutation: MutationRecord) => boolean,
	obOptions?: MutationObserverInit,
): Promise<MutationRecord>;
function waitUntilDomConditionLoaded(
	condition: (mutation: MutationRecord) => boolean,
	obOptions?: MutationObserverInit,
	target?: Node,
) {
	return new Promise(resolve => {
		obOptions = obOptions || { childList: true, subtree: true, attributes: true };
		target = target || document.body;
		new MutationObserver((mutationList, observer) => {
			for (const mutation of mutationList) {
				if (condition(mutation)) {
					observer.disconnect();
					return resolve(mutation);
				}
			}
		}).observe(target, obOptions);
	});
}

function waitUntilDomLoaded<T extends HTMLElement | Element | HTMLElement[] | Element[]>(
	query: string,
	selectAll: boolean,
	timeout?: (() => boolean) | number,
): Promise<T> {
	return new Promise((resolve, reject) => {
		const start = Date.now();
		const reportTimeout = () => reject(`waitUntilDomLoaded timeout <${query}>`);
		const walk = () => {
			const dom = selectAll ? document.querySelectorAll(query) : document.querySelector(query);
			if (selectAll ? (dom ? (dom as any).length : false) : dom) {
				return resolve(dom as any);
			} else {
				if (timeout) {
					if (typeof timeout === 'function') {
						if (timeout()) {
							return reportTimeout();
						}
					} else {
						const passtime = (Date.now() - start);
						if (passtime >= timeout) return reportTimeout();
					}
				}

				return setTimeout(walk, 100);
			}
		};
		setTimeout(walk);
	});
}

export const filterNonUnique = arr => arr.filter(i => arr.indexOf(i) === arr.lastIndexOf(i));

export const filterNonUniqueBy = (arr, fn) => arr.filter((v, i) => arr.every((x, j) => (i === j) === fn(v, x, i, j)));

export const getURLParameters = url =>
	(url.match(/([^?=&]+)(=([^&]*))/g) || []).reduce(
		(a, v) => ((a[v.slice(0, v.indexOf('='))] = v.slice(v.indexOf('=') + 1)), a),
		{},
	);

export {
	waitUntilDomConditionLoaded,
	waitUntilDomLoaded,
	parseCookie,
};
