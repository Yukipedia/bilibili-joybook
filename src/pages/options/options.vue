<template>
<v-app>
	<!-- 扩充容器 -->
	<v-card flat style="height:100%; background-color:var(--md-background-color)">
		<v-toolbar color="primary" height="0" dark extended extension-height="200" flat>
			<h1 class="display-4 font-weight-light font-italic" slot="extension">BILIBILI_JOYBOOK</h1>
		</v-toolbar>

		<!-- 200px 是toolbar extended 的高度 -->
		<v-layout row :class="{ 'options-container': true, 'options-container--active': containerActive }">
			<v-card class="card--flex-toolbar">
				<v-toolbar card prominent>
					<v-toolbar-title class="font-weight-light font-italic body-2 grey--text">v{{version}}</v-toolbar-title>
					<v-spacer></v-spacer>
					<v-menu bottom left>
						<v-btn slot="activator" icon><v-icon>more_vert</v-icon></v-btn>
						<v-list>
							<v-list-tile
								v-for="(option, i) in moreOption"
								:key="i"
								@click="option.callback"
							>
								<template v-if="option.subtitle">
									<v-list-tile-content>
										<v-list-tile-title>{{ option.title }}</v-list-tile-title>
										<v-list-tile-sub-title>{{ option.subtitle }}</v-list-tile-sub-title>
									</v-list-tile-content>
								</template>
								<v-list-tile-title v-else>{{ option.title }}</v-list-tile-title>
							</v-list-tile>
						</v-list>
					</v-menu>
				</v-toolbar>
				<v-divider></v-divider>
				<v-card-text :style="{ padding: containerActive ? '0 0 48px 0' : '16px 16px 48px 16px', transition: 'padding .6s cubic-bezier(0.65, 0.05, 0.36, 1)'}">
					<v-layout row>
						<v-flex xs12>
							<transition appear name="fade-transition" mode="out-in">
								<keep-alive include="subpage">
									<router-view :configuration="configuration" :optionsInterface="optionsInterface"></router-view>
								</keep-alive>
							</transition>
						</v-flex>
					</v-layout>
				</v-card-text>
			</v-card>
		</v-layout>
	</v-card>
</v-app>
</template>

<script lang='ts'>
import { Component, Vue, Watch } from 'vue-property-decorator';
import { CONFIGURATION, OPTIONUI } from '../../modules';

@Component
export default class Options extends Vue {
	public configuration = CONFIGURATION;
	public optionsInterface = OPTIONUI;
	public version: string = require('../../../package.json').version;

	// tslint:disable trailing-comma whitespace
	public moreOption = [
		{ title: '清除所有数据', subtitle: '包括同步的数据', callback: this.clearStorage }
	];
	// tslint:enable trailing-comma whitespace

	public get containerActive() {
		return !['setting', 'redirect'].includes(this.$route.name!);
	}

	public clearStorage() {
		chrome.storage.sync.clear();
		chrome.storage.local.clear();
		chrome.tabs.create({
			url: 'https://www.bilibili.com',
			selected: true,
		});
	}

	public mounted() {
		if (this.$route.name === 'redirect' && this.$route.query && typeof this.$route.query.to === 'string') {
			setTimeout(() => {
				this.$router.replace({ path: this.$route.query.to as string });
			}, 500);
		}
		if (this.$route.query.catlog) {
			chrome.tabs.create({
				url: 'https://github.com/Yukipedia/bilibili-joybook/releases',
				selected: true,
			});
		}
	}
}
</script>

<style lang='scss'>
:root {
	--md-background-color: rgb(248, 249, 250);
	--md-loading-message-color: #6e6e6e;
	--md-toolbar-color: rgb(51, 103, 214);

	--subpage-header-line-title-color: rgb(90, 90, 90);
}

html,
body {
	height: 100%;
	width: 100%;
	margin: 0;
	padding: 0;
	// override Vuetify overflow-y: scroll
	overflow-x: hidden !important;
	overflow-y: auto !important;
}

html {
	background-color: var(--md-background-color);
	touch-action: manipulation;
}
// override Vuetify font-family: 'Roboto', sans-serif
.application {
	font-family: Roboto, 'Segoe UI',Arial,'Microsoft Yahei',sans-serif;
}

:not(input):not(textarea) {
	&,
	&::after,
	&::before {
		user-select: none;
		cursor: inherit;
	}
}

.options {
	&-container {
		min-height: 0;
		will-change: min-height;
		transition: min-height .6s cubic-bezier(0.65, 0.05, 0.36, 1);

		&--active {
			min-height: calc(100% - 200px);
		}
	}
}

.v-btn.v-btn--icon img {
	pointer-events: none;
}

.card--flex-toolbar {
	box-sizing: border-box;
	display: block;
	height: inherit;
	max-width: calc(750px + 3 * 2px);
	// max-width: 680px;
	min-width: 550px;
	position: relative;
	width: 96%;
	margin: -64px auto 0 auto;
	overflow: hidden;
}
</style>
