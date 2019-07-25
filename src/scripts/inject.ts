import InjectHost from '@/lib/InjectHost';
import AlwaysJumpTo from '@/modules/inject/alwaysJumpTo';
import DisableDanmakuMask from '@/modules/inject/disableDanmakuMask';
// import FixPlayerData from '@/modules/inject/plugins/fixPlayerData';
// import FixUserData from '@/modules/inject/plugins/fixUserData';
import SyncPageAction from '@/modules/inject/plugins/syncPageAction';
import SkipSponsor from '@/modules/inject/skipSponsor';


new InjectHost({
	AlwaysJumpTo,
	DisableDanmakuMask,
	// FixPlayerData,
	// FixUserData,
	SkipSponsor,
	SyncPageAction,
	// AddToBlocklist,
});
