<template>
<div>
	<settings-toggle-button
		label="开启AV拦截"
		sublabel="开启后，符合屏蔽条件的视频会被替换。"
		:value="moduleSwitch"
		@trigger="mainSwitchTrigger"
	></settings-toggle-button>
	<v-divider></v-divider>
	<!-- TODO: 实装此功能 -->
	<settings-toggle-button
		label="使用B站黑名单进行屏蔽"
		sublabel="开启后，妮黑名单内的用户会添加进阻止列表。"
		:value="concatBlacklist"
		@trigger="addBiliBlocklist"
	></settings-toggle-button>
	<v-divider></v-divider>
	<v-list two-line>
		<v-list-tile :to="{ path: 'global' }" append>
			<v-list-tile-content>
				<v-list-tile-title>全局屏蔽设置</v-list-tile-title>
			</v-list-tile-content>

			<v-list-tile-action>
				<v-btn icon>
					<v-icon>arrow_right</v-icon>
				</v-btn>
			</v-list-tile-action>
		</v-list-tile>
		<v-list-tile :to="{ path: name }" append v-for="(rid, name) in rid" :key="name">
			<v-list-tile-content>
				<v-list-tile-title>{{ title(name) }}屏蔽设定</v-list-tile-title>
			</v-list-tile-content>

			<v-list-tile-action>
				<v-btn icon>
					<v-icon>arrow_right</v-icon>
				</v-btn>
			</v-list-tile-action>
		</v-list-tile>
	</v-list>
</div>
</template>

<script lang='ts'>
import Storageable from '@/components/mixins/Storageable';
import settingsToggleButton from '@/components/settingsToggleButton.vue';
import { Component, Mixins, Vue } from 'vue-property-decorator';
import config, { RID } from '../config';
import avblockerBlockOptions from './avblockerBlockOptions.vue';

@Component({
	components: {
		settingsToggleButton,
	},
})
export default class AVBlockerOptionsInterface extends Storageable {
	public name: string = 'AVBlockerOptionsInterface';
	public moduleSwitch: boolean = false;
	public concatBlacklist: boolean = false;
	public rid = RID;

	public created() {
		this.$router.addRoutes([{
			path: '/:moduleName/:section',
			name: 'section',
			component: avblockerBlockOptions,
			props: true,
		}]);
		this.storage.once('ready', () => {
			this.moduleSwitch = this.storage.get(
				'local',
				config.storageOptions.switch,
				config.storageOptions.defaultSwitch,
			);
			this.concatBlacklist = this.storage.get(config.storageOptions.area, `${config.storageOptions.location}.global.concatBlacklist`);
		});
		if (this.$route.query && this.$route.query.section) {
			setTimeout(() => {
				this.$router.replace({ path: this.$route.query.section as string, append: true });
			}, 650);
		}
	}

	public async addBiliBlocklist(value) {
		this.storage.set(config.storageOptions.area, `${config.storageOptions.location}.global.concatBlacklist`, value);
		if (!value) return;

		const getBlacklistData = (page: number = 1): Promise<bili.Blacklist> => {
			return this.axios.get(`https://api.bilibili.com/x/relation/blacks?re_version=0&pn=${page}&ps=50`).then(response => response.data);
		};

		const response = await getBlacklistData();
		const addToBlocklist = (list: number[]) => {
			return new Promise(resolve => {
				const ownerlist: number[] = this.storage.get(config.storageOptions.area, `${config.storageOptions.location}.global.owner`);
				this.storage.set(config.storageOptions.area, `${config.storageOptions.location}.global.owner`, ownerlist.concat(list.filter(v => !ownerlist.includes(v)))).then(() => resolve());
			});
		};
		// 50是每次请求返回的条目数
		if (response.data.total > 50) {
			const totalP = Math.ceil(response.data.total / 50);
			await addToBlocklist(response.data.list.map(v => v.mid));
			for (let i = 1; i < totalP; i++) {
				const list = await getBlacklistData(i + 1).then(response => response.data.list).then(list => list.map(v => v.mid));
				await addToBlocklist(list);
			}
		} else {
			addToBlocklist(response.data.list.map(v => v.mid));
		}
	}

	public title(name) {
		switch (name) {
			case 'douga': return '动画';
			case 'bangumi': return ' 番剧';
			case 'guochuang': return '国创';
			case 'music': return '音乐';
			case 'dance': return '舞蹈';
			case 'game': return '游戏';
			case 'technology': return '科技';
			case 'digital': return '数码';
			case 'life': return '生活';
			case 'kichiku': return '鬼畜';
			case 'fashion': return '时尚';
			case 'ad': return '广告';
			case 'ent': return '娱乐';
			case 'movie': return '电影';
			case 'teleplay': return 'TV剧';
			case 'cinephile': return '影视';
			case 'documentary': return '纪录片';
			default: return '???';
		}
	}

	public mainSwitchTrigger(value) {
		this.storage.set('local', config.storageOptions.switch, value);
	}
}
</script>
