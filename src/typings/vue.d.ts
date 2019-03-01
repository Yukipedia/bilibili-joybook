import Vue from 'vue';

declare module 'vue/types/vue' {
	export interface Vue {
		readonly _uid: number;
	}
}
