import { envContext } from '@/lib/Module';
import ModuleManager from '@/lib/ModuleManager';

import AlwaysJumpTo from '@/modules/inject/alwaysJumpTo';
import AVBlocker from '@/modules/inject/avblocker';
import DisableDanmakuMask from '@/modules/inject/disableDanmakuMask';
import Hotkey from '@/modules/inject/hotkey';
import MXHRR from '@/modules/inject/MXHRResponse';
import { AddToBlocklist, FixPlayerData, FixUserData, Logger } from '@/modules/inject/plugins';

const injectModules = {
	AddToBlocklist,
	AlwaysJumpTo,
	AVBlocker,
	DisableDanmakuMask,
	FixPlayerData,
	FixUserData,
	Hotkey,
	Logger,
	MXHRR,
};


new ModuleManager({ env: envContext.inject, modules: injectModules as any });
