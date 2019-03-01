<template>
<div>
	<v-toolbar flat light class="pt-2 pb-4" style="background-color: inherit;" height="48">
		<v-btn icon @click="$router.push({ path: `/${config.name.toLowerCase()}` })"><v-icon>arrow_back</v-icon></v-btn>
		<h1 class="subheading">{{ title }}屏蔽设置</h1>
	</v-toolbar>
	<settings-toggle-button
		v-if="section !== 'global'"
		label="与全局屏蔽合并"
		sublabel="全局屏蔽的设定也适用于此选区"
		:value="merge"
		@trigger="triggerMerge"
	></settings-toggle-button>
	<v-divider></v-divider>
	<v-expansion-panel ref="panel" expand v-model="expanded" class="elevation-0">
		<aid-section @loaded="autoExpand" :section="section"></aid-section>
		<v-divider></v-divider>
		<mid-section @loaded="autoExpand" :section="section"></mid-section>
		<v-divider></v-divider>
	</v-expansion-panel>
</div>
</template>

<script lang='ts'>
import Storageable from '@/components/mixins/Storageable';
import settingsToggleButton from '@/components/settingsToggleButton.vue';
import AidSection from './avblockerAidSection.vue';
import MidSection from './avblockerOwnerSection.vue';
import { Component, Prop, Vue } from 'vue-property-decorator';
import config from '../config';

@Component({
	components: {
		settingsToggleButton,
		AidSection,
		MidSection,
	},
})
export default class AVBlockerBlockOptions extends Storageable {
	public name: string = 'AVBlockerBlockOptions';
	public config = config;

	@Prop(String) public section!: string;

	public merge: boolean = false;
	public expanded: boolean[] = [];

	public get title() {
		switch (this.section) {
			case 'global':          return '全局';
			case 'douga':           return '动画';
			case 'bangumi':         return ' 番剧';
			case 'guochuang':       return '国创';
			case 'music':           return '音乐';
			case 'dance':           return '舞蹈';
			case 'game':            return '游戏';
			case 'technology':      return '科技';
			case 'digital':         return '数码';
			case 'life':            return '生活';
			case 'kichiku':         return '鬼畜';
			case 'fashion':         return '时尚';
			case 'ad':              return '广告';
			case 'ent':             return '娱乐';
			case 'movie':           return '电影';
			case 'teleplay':        return 'TV剧';
			case 'cinephile':       return '影视';
			case 'documentary':     return '纪录片';
			default:                return '全局';
		}
	}

	public getMergeSwitch() {
		this.storage.nativeGet<joybook.avblocker.SectionBlockList>(config.storageOptions.area, `${config.storageOptions.location}.${this.section}`)
			.then(blocklist => {
				console.log(blocklist);
				if (blocklist.merge) this.merge = true;
			});
	}

	public triggerMerge(value: boolean) {
		this.storage.set(config.storageOptions.area, `${config.storageOptions.location}.${this.section}.merge`, value);
	}

	public autoExpand(vm) {
		const children = (this.$refs.panel as Vue).$children.filter(v => v.$el.classList.contains('v-expansion-panel__container'));
		const childIndex = children.indexOf(vm);
		if (this.expanded.length === 0) this.expanded = Array.from({ length: children.length }, () => false);
		if (childIndex < 0) return;
		this.expanded.splice(childIndex, 1, true);
	}

	public created() {
		this.section !== 'global' && this.getMergeSwitch();
	}
}
</script>

<style lang='scss'>
</style>
