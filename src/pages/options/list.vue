<template>
<v-list subheader two-line>
	<v-subheader>模块开关</v-subheader>
	<v-card>
		<template v-for="(config, key, index) in configuration">
			<v-list-tile
				:key="config.setting.title"
				:id="config.name"
				:to="hasOptionUI(config.name) && { path: `/${config.name.toLowerCase()}` } || null"
			>
				<v-list-tile-content>
					<v-list-tile-title>{{ config.setting.title }}</v-list-tile-title>
					<v-list-tile-sub-title>{{ config.setting.desc }}</v-list-tile-sub-title>
				</v-list-tile-content>

				<v-list-tile-action>
					<module-switch v-if="!hasOptionUI(config.name)" :config="config"></module-switch>
					<v-btn v-else icon :to="{ path: `/${config.name.toLowerCase()}` }">
						<v-icon>arrow_right</v-icon>
					</v-btn>
				</v-list-tile-action>
			</v-list-tile>
			<v-divider :key="index" v-if="index + 1 !== Object.keys(configuration).length"></v-divider>
		</template>
	</v-card>
	<!-- 不知道是哪个东西的特性 没有在template里面写v-switch就不会导入v-switch的样式 -->
	<v-switch v-if="false"></v-switch>
</v-list>
</template>

<script lang='ts'>
import Optionsable from '@/components/mixins/Optionsable';
import ChromeAsyncStorage from '@/utils/chrome/storage';
import { Component, Vue } from 'vue-property-decorator';

let requireReload: boolean = false;

Vue.component('module-switch', {
	props: ['config'],
	data() {
		return {
			switch: this.config.storageOptions.defaultSwitch,
			storage: new ChromeAsyncStorage(),
		};
	},
	watch: {
		switch(val) {
			console.log(val);
			this.storage.set('local', this.config.storageOptions.switch, val);
		},
	},
	created() {
		this.storage.once('ready', () => {
			this.switch = this.storage.get('local', this.config.storageOptions.switch);
		});
		this.storage.init();
	},
	render(h) {
		return h('v-switch', {
			props: {
				inputValue: this.switch,
				hideDetails: true,
			},
			on: {
				change: evnet => {
					this.switch = !this.switch;
					if (this.config.setting.requireReload) {
						requireReload = true;
					}
				},
			},
		});
	},
});

@Component
export default class ModuleSetting extends Optionsable {
	public hasOptionUI(name: string) {
		return !!this.optionsInterface[name.toLowerCase()];
	}

	public mounted() {
		window.onbeforeunload = ev => {
			if (requireReload) {
				chrome.runtime.reload();
			}
		};
	}
}
</script>

<style lang="scss">
.theme--light {
	.v-divider {
		border-color: rgba(0, 0, 0, 0.06);
	}
}
</style>
