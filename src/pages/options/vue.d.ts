import Vue from 'vue';
import { CONFIGURATION, OPTIONUI } from '../../modules';

declare module 'vue/types/vue' {
	export interface Vue {
		readonly configuration: typeof CONFIGURATION;
		readonly optionsInterface: typeof OPTIONUI;
	}
}
