export default class RegExpPattern {
	public static get videoUrlPattern() {
		return /(bangumi\/play\/ss\d+)|(bangumi\/play\/ep\d+)|(video\/av\d+)/ig;
	}

	public static get homeUrlPattern() {
		return /www\.bilibili\.com\/?$/ig;
	}

	public static get bangumiUrlPattern() {
		return /(bangumi\/play\/ss\d+)|(bangumi\/play\/ep\d+)/ig;
	}

	public static get favoriteFolders() {
		return /\/\/api\.bilibili\.com\/x\/v2\/fav\/folder/ig;
	}

	public static get dynamicRegion() {
		return /\/\/api\.bilibili\.com\/x\/web-interface\/dynamic\/region/ig;
	}

	public static get rankingRegion() {
		return /\/\/api\.bilibili\.com\/x\/web-interface\/ranking\/region/ig;
	}

	public static get accountSpace() {
		return /\/\/space\.bilibili\.com\/\d+/ig;
	}

	public static get heartbeat() {
		return /x\/report\/web\/heartbeat/ig;
	}

	public static get sponsor() {
		return /\/\/bangumi\.bilibili\.com\/sponsor\/web_api\/v2\/rank\/total/ig;
	}
}
