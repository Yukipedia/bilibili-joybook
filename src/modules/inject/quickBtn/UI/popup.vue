<template>
<v-card flat>
	<v-container grid-list-xs>
		<v-layout column>
			<v-flex xs12 d-flex>
				<v-btn dark color="primary" @click="gotoBiliHome">前往BiliBili</v-btn>
			</v-flex>
		</v-layout>
	</v-container>
</v-card>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class QuickBtnPopup extends Vue {
	public name: string = 'quickBtnPopup';

	public gotoBiliHome() {
		chrome.tabs.create({
			url: 'https://www.bilibili.com/',
			selected: true,
		});
	}
}
</script>

<style lang='scss'>
</style>
