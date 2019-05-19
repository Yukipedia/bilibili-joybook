<template>
<v-card flat>
	<v-divider></v-divider>
	<v-layout class="my-1" justify-center align-center row wrap>
		<v-avatar size="22px" class="mx-1">
			<v-img :src="icon"></v-img>
		</v-avatar>
		<div>JoyBook</div>
		<v-spacer></v-spacer>
		<!-- <v-tooltip left>
			<v-btn @click="deleteStorage" slot="activator" class="ma-0 mx-1" icon small>
				<img src="@/assets/twotone-delete-24px.svg">
			</v-btn>
			<span>删除所有数据</span>
		</v-tooltip> -->
		<v-btn @click="gotoSettings" class="ma-0 mx-1" icon small>
			<img src="@/assets/img/svg/twotone-settings-24px.svg">
		</v-btn>
	</v-layout>
</v-card>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class App extends Vue {
	public name: string = '';

	public icon: string = require('@public/icons/48.png');

	// public deleteStorage() {
	// 	chrome.storage.local.clear();
	// 	chrome.storage.sync.clear();
	// }

	public gotoSettings() {
		chrome.tabs.create({
			url: `chrome-extension://${chrome.runtime.id}/options.html`,
			selected: true,
		});
	}
}
</script>

<style lang='scss'>
</style>
