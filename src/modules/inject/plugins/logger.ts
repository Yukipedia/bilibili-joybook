import Module, { envContext } from '@/lib/Module';

export default class Logger extends Module {
	constructor() {
		super({
			name: 'plugin:logger',
			context: envContext.inject,
			priority: 10,
		});
	}

	public launch() {
		this.main();
		this.launchComplete();
	}

	public main() {
		const ori_consoleLog = console.log;
		function log(...msg: any): void {
			return ori_consoleLog.call(this, '%cJoyBook:', `background: #00897B; color: #B2DFDB;`, ...msg);
		}
		function warn(...msg: any): void {
			return ori_consoleLog.call(this, '%cJoyBook:', `background: #FB8C00; color: #FFCA28;`, ...msg);
		}
		function error(...msg: any): void {
			return ori_consoleLog.call(this, '%cJoyBook:', `background: #D81B60; color: #F8BBD0;`, ...msg);
		}
		joybook.log = log;
		joybook.warn = warn;
		joybook.error = error;
	}
}
