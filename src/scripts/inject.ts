import AVBlocker from '@/modules/inject/avblocker';
import DisableDanmakuMask from '@/modules/inject/disableDanmakuMask';
import Hotkey from '@/modules/inject/hotkey';
import MXHRR from '@/modules/inject/MXHRResponse';
import { FixUserData } from '@/modules/inject/plugins';

const injectModules = {
	AVBlocker,
	DisableDanmakuMask,
	FixUserData,
	Hotkey,
	MXHRR,
	SkipSponsor,
};

import AlwaysJumpTo from '@/modules/inject/alwaysJumpTo';
import SkipSponsor from '@/modules/inject/skipSponsor';

import AddToBlocklist from '@/modules/inject/plugins/addToBlocklist';
import FixPlayerData from '@/modules/inject/plugins/fixPlayerData';

import InjectHost from '@/lib/InjectHost';

// @ts-ignore
new InjectHost({ AlwaysJumpTo, SkipSponsor, AddToBlocklist, FixPlayerData });
