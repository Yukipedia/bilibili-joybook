// import { envContext } from '@/lib/Module';
// import ModuleManager from '@/lib/ModuleManager';

// import AlwaysJumpTo from '@/modules/inject/alwaysJumpTo';
// import AVBlocker from '@/modules/inject/avblocker';
// import DisableDanmakuMask from '@/modules/inject/disableDanmakuMask';
// import Hotkey from '@/modules/inject/hotkey';
// import MXHRR from '@/modules/inject/MXHRResponse';
// import SkipSponsor from '@/modules/inject/skipSponsor';
// import { AddToBlocklist, FixPlayerData, FixUserData, Logger } from '@/modules/inject/plugins';

// const injectModules = {
// 	AddToBlocklist,
// 	AlwaysJumpTo,
// 	AVBlocker,
// 	DisableDanmakuMask,
// 	FixPlayerData,
// 	FixUserData,
// 	Hotkey,
// 	Logger,
// 	MXHRR,
// 	SkipSponsor,
// };


// new ModuleManager({ env: envContext.inject, modules: injectModules as any });

import AlwaysJumpTo from '@/modules/inject/alwaysJumpTo';
import InjectHost from '@/lib/InjectHost';

// @ts-ignore
new InjectHost({ AlwaysJumpTo });
