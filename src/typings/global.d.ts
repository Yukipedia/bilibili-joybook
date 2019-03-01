interface Window {
	aid: string;
	cid: string;
	mid: number;
	season_id: number;
	joybook: {
		id: string;
	};
	jQuery: any;
	$: any;
	player: bili.Player;
	__INITIAL_STATE__: bili.__INITIAL_STATE__;
}

// tslint:disable variable-name
interface Promise<T> {
	compose<T>(transformer: (_this: any) => Promise<any>): Promise<T>;
}
// tslint:enable variable-name
