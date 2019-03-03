import { config as AccountShareConfig } from './background/accountShare';
import { config as AlwaysJumpToConfig } from './inject/alwaysJumpTo';
import AVBlockerConfig from './inject/avblocker/config';
import { config as DisableDanmakuMaskConfig } from './inject/disableDanmakuMask';
import { config as SkipSponsorConfig } from './inject/skipSponsor';

import { default as AVBlockerOptionsInterface } from './inject/avblocker/UI/avblockerOptionsInterface.vue';

import { default as AccountSharePopup } from './background/accountShare/UI/popup.vue';
import { default as QuickBtn } from './inject/quickBtn/UI/popup.vue';

export const POPUPUI = {
	['AccountShare'.toLowerCase()]: AccountSharePopup,
	['QuickBtn'.toLowerCase()]: QuickBtn,
};

export const OPTIONUI = {
	['AVBlocker'.toLowerCase()]: AVBlockerOptionsInterface,
};

export const CONFIGURATION = {
	['AccountShare'.toLowerCase()]: AccountShareConfig,
	['AVBlocker'.toLowerCase()]: AVBlockerConfig,
	['AlwaysJumpTo'.toLowerCase()]: AlwaysJumpToConfig,
	['DisableDanmakuMask'.toLowerCase()]: DisableDanmakuMaskConfig,
	['SkipSponsorConfig'.toLowerCase()]: SkipSponsorConfig,
};
