interface Window {
	aid: string;
	cid: string;
	mid: number;
	season_id: number;
	joybook: {
		log: (...msg: string[]) => void;
		warn: (...msg: string[]) => void;
		error: (...msg: string[]) => void;
	};
	jQuery: any;
	$: any;
	player: bili.Player;
	__INITIAL_STATE__: bili.__INITIAL_STATE__;
	__PGC_USERSTATE__: bili.__PGC_USERSTATE__;
	XMLHttpRequest: XMLHttpRequest;
}

// tslint:disable variable-name
interface Promise<T> {
	compose<T>(transformer: (_this: any) => Promise<any>): Promise<T>;
}
// tslint:enable variable-name
