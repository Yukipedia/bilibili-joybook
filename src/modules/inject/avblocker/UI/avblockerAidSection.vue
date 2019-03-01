<template>
<v-expansion-panel-content :disabled="!loaded">
	<v-layout justify-center align-center slot="header">
		<v-flex>
			根据视频ID屏蔽(av号)
		</v-flex>
		<v-spacer></v-spacer>
		<v-flex xs1><v-progress-circular v-show="!loaded" indeterminate color="primary"></v-progress-circular></v-flex>
	</v-layout>
	<v-data-table
		v-model="selected"
		select-all item-key="aid"
		:headers="headers"
		:items="archives"
		:pagination.sync="pagination"
		rows-per-page-text="每页行数"
	>
		<template slot="items" slot-scope="props">
			<td>
				<v-checkbox
					v-model="props.selected"
					primary
					hide-details
				></v-checkbox>
			</td>
			<td>
				<v-edit-dialog
					large
					lazy
					persistent
					@save="changeAid(props.item.aid)"
				>
					{{ props.item.aid }}
					<v-text-field
						slot="input"
						:value="props.item.aid"
						:rules="[rules.max8chars]"
						:data-aid="props.item.aid"
						label="AV号"
						single-line
						counter
					></v-text-field>
				</v-edit-dialog>
			</td>
			<td>
				<template v-if="props.item.owner">
					<v-avatar size="28" class="pr-2">
						<img :src="props.item.owner.face" :alt="props.item.owner.name">
					</v-avatar>
					{{ props.item.owner.name }}&#60;{{ props.item.owner.mid }}&#62;
				</template>
				<template v-else>&#60;403|404|502&#62;</template>
			</td>
			<td>
				<template v-if="props.item.typename || props.item.tname">{{ props.item.typename || props.item.tname }}</template>
				<template v-else>&#60;403|404|502&#62;</template>
			</td>
		</template>

		<template slot="no-data">
			<div class="text-xs-center">
				没有任何数据在此
			</div>
		</template>

		<template slot="footer">
			<!-- 加1是因为有三个td 第一个是checkbox -->
			<td :colspan="headers.length + 1">
				<v-layout row wrap>
					<v-flex xs3 d-flex>
						<v-btn @click.prevent.stop="aidTextareaDialog = true" color="primary" dark>
							添加AV号
							<v-icon right dark>add</v-icon>
						</v-btn>
					</v-flex>
					<v-flex xs3 d-flex>
						<v-btn @click.prevent.stop="deleteAid" color="primary" dark>
							删除所选
							<v-icon right dark>delete</v-icon>
						</v-btn>
					</v-flex>
				</v-layout>
			</td>
		</template>
		<template slot="pageText" slot-scope="props">
			总 - {{ props.itemsLength }} 当前 {{ props.pageStart }} - {{ props.pageStop }}
		</template>
	</v-data-table>
	<v-dialog max-width="350px" v-model="aidTextareaDialog">
		<v-card>
			<v-card-title><span class="headline">添加视频ID</span></v-card-title>
			<v-card-text>
				<v-textarea ref="aidTextarea" v-model="aidTextarea" :rules="[rules.avid]" label="使用英文符号<;>来间隔每个视频ID"></v-textarea>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color="primary" @click="addAid(aidTextarea)">添加到屏蔽列表</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</v-expansion-panel-content>
</template>

<script lang='ts'>
import Storageable from '@/components/mixins/Storageable';
import { Component, Prop, Vue } from 'vue-property-decorator';
import config from '../config';

@Component
export default class AVBlockerAidSection extends Storageable {
	public name: string = 'avblockerAidSection';

	@Prop({ type: String, required: true }) public section!: string;

	public headers = [
		{ text: 'av号', align: 'left', sortable: true, value: 'aid' },
		{ text: '发布者', align: 'left', sortable: false, value: 'owner' },
		{ text: '类型', align: 'left', sortable: false },
	];
	public pagination = {
		sortBy: 'aid',
		descending: true,
		rowsPerPage: 10,
	};
	public rules = {
		max8chars: (v: number | string) => {
			if (typeof v === 'undefined') return true;
			return String(v).length <= 8 || '我相信B站视频数量还没到达9位数';
		},
		avid: v => /^[0-9;\n]*$/.test(v || '') || '只允许输入数字、换行符以及分隔符<;>',
	};

	public loaded: boolean = false;
	public blocklist: joybook.avblocker.BlockList = {} as any;
	public archives: bili.DynamicRegionArchive[] = [];
	public selected: bili.DynamicRegionArchive[] = [];
	public aidTextareaDialog: boolean = false;
	public aidTextarea: string = '';

	public toggleAll() {
		if (this.selected.length) this.selected = [];
		else this.selected = this.archives.slice();
	}

	public changeSort(column) {
		if (this.pagination.sortBy === column) {
			this.pagination.descending = !this.pagination.descending;
		} else {
			this.pagination.sortBy = column;
			this.pagination.descending = false;
		}
	}

	public changeAid(aid: number) {
		const elem = document.querySelector(`[data-aid="${aid}"]`) as HTMLInputElement;
		const replaceAid = Number(elem.value);
		// continue or not?
		if (
			!elem ||
			isNaN(replaceAid) ||
			!this.uniqueCheck(this.blocklist.aid, replaceAid) ||
			typeof this.rules.max8chars(replaceAid) === 'boolean' ? false : true
		) return;

		const exist = this.blocklist.aid.indexOf(Number(aid));
		exist !== -1 && this.blocklist.aid.splice(exist, 1, replaceAid);
		this.syncArchives(this.blocklist);
		this.syncBlocklist(this.blocklist);
	}

	public addAid(value: string) {
		value = value.replace('\n', '');
		if (String(value).length <= 0) return;

		if ((this.$refs.aidTextarea as any).validate() && Object.keys(this.blocklist).length > 0) {
			for (const av of value.split(';')) {
				if (av.length <= 0) continue;
				// 如果没有重复
				if (this.blocklist.aid.indexOf(Number(av)) < 0) {
					this.blocklist.aid.push(Number(av));
				}
			}
			this.closeAidTextareaDialog();
			this.clearTextarea();
			this.syncArchives(this.blocklist);
			this.syncBlocklist(this.blocklist);
		}
	}

	public deleteAid() {
		const aidToDelete = this.selected.map(v => v.aid);

		for (const aid of aidToDelete) {
			const exist = this.blocklist.aid.indexOf(aid);
			exist !== -1 && this.blocklist.aid.splice(exist, 1);
		}
		this.syncArchives(this.blocklist);
		this.syncBlocklist(this.blocklist);
	}

	public uniqueCheck(aidlist: number[], aid) {
		return aidlist.indexOf(aid) === -1;
	}

	public clearTextarea() {
		this.aidTextarea = '';
	}

	public closeAidTextareaDialog() {
		this.aidTextareaDialog = false;
	}

	public syncBlocklist(blocklist: joybook.avblocker.BlockList) {
		return this.storage.set(config.storageOptions.area, `${config.storageOptions.location}.${this.section}`, blocklist);
	}

	public syncArchives(blocklist: joybook.avblocker.BlockList) {
		const archives = this.storage.get<joybook.avblocker.ArchivesCache>('local', 'Archives') || {};
		const Q: Array<Promise<bili.ViewData>> = [];
		for (const aid of blocklist.aid) {
			if (archives[aid] && Object.keys(archives[aid]).length >= 1) continue;
			Q.push(
				this.axios.get<bili.ViewData>(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`)
					.then(res => res.data)
					.then(res => {
						switch (Math.abs(Number(res.code))) {
							case 0:
								return Promise.resolve(res);
							case 404:
							default:
								archives[aid] = { aid } as any;
								this.storage.set('local', `Archives.${aid}`, archives[aid]) as any;
								return Promise.resolve(null as any);
						}
					}),
			);
		}
		return Promise.all(Q)
			.then(result => {
				console.log(result);
				const Q: Array<Promise<any>> = [];
				for (const archive of result) {
					// 如果result是空数组archive则为undefined 而undefined!==null
					// 就会触发archive undefined错误;
					if (!archive) continue;
					Q.push(this.storage.set('local', `Archives.${archive.data.aid}`, archive.data));
				}
				return Promise.all(Q);
			})
			.then(() => {
				this.archives =
					Object.values<bili.DynamicRegionArchive>(this.storage.get('local', 'Archives', []))
						// 只显示当前blocklist内的aid数据
						.filter(v => blocklist.aid.includes(v.aid));
			});
	}

	public created() {
		this.storage.once('ready', () => {
			this.blocklist = this.storage.get<joybook.avblocker.BlockList>(config.storageOptions.area, `${config.storageOptions.location}.${this.section}`);
			this.syncArchives(this.blocklist)
				.then(() => {
					this.loaded = true;
					this.$emit('loaded', this);
				});
		});
	}
}
</script>

<style lang='scss'>
</style>
