import { waitUntilDomLoaded } from '@/utils/helper';

const overrideConsole = document.createElement('script');

overrideConsole.innerText = `
	var errordummy = function(){ return true; };
	console.log = function(){};
	window.onerror = errordummy;
`;
(document.head! || document.documentElement!).appendChild(overrideConsole);

async function collectRankingRegionData() {
	const rankitems = await waitUntilDomLoaded<HTMLElement[]>('ul.rank-list li.rank-item', true);
	const rankdata: joybook.avblocker.RankData[] = [];

	for (const items of rankitems) {
		const nums = items.querySelector<HTMLElement>('.num');
		const title = items.querySelector<HTMLElement>('.content .info .title');
		const play = items.querySelector<HTMLElement>('.content .detail span:first-child');
		const danmaku = items.querySelector<HTMLElement>('.content .detail span:nth-child(2)');
		const mid = items.querySelector<HTMLElement>('.content .detail a');
		const aid = items.querySelector<HTMLElement>('.content .info .title');
		const pts = items.querySelector<HTMLElement>('.content .info .pts > div');

		const data: joybook.avblocker.RankData = {
			rank: nums ? Number(nums.innerText) : 0,
			title: title ? title.innerText : '',
			play: 0,
			danmaku: danmaku ? Number(danmaku.innerText) : 0,
			mid: 0,
			aid: 0,
			pts: pts ? Number(pts.innerText) : 0,
		};

		// 3.6万 -> '3.6000' -> 36000
		if (play) data.play = Number(play.innerText.replace(/万/i, match => '000').replace('.', ''));
		if (danmaku) data.danmaku = Number(danmaku.innerText.replace(/万/i, match => '000').replace('.', ''));
		if (mid && mid.getAttribute('href')) {
			const spaceHref = mid.getAttribute('href')!;
			data.mid = Number(spaceHref.substring(spaceHref.lastIndexOf('/') + 1));
		}
		if (aid && aid.getAttribute('href')) {
			const avlink = aid.getAttribute('href')!;
			data.aid = Number(avlink.split(/\/av/i)[1].replace('/', ''));
		}

		rankdata.push(data);
	}

	chrome.runtime.sendMessage(chrome.runtime.id, {
		name: 'serve:collectRankingRegionDataNext',
		currentData: rankdata,
	});
}

if (self !== top) {
	document.addEventListener('DOMContentLoaded', () => {
		collectRankingRegionData();
	});
}
