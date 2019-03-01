<template>
<v-expansion-panel-content :disabled="!loaded">
	<v-layout justify-center align-center slot="header">
		<v-flex>
			根据用户ID屏蔽
		</v-flex>
		<v-spacer></v-spacer>
		<v-flex xs1><v-progress-circular v-show="!loaded" indeterminate color="primary"></v-progress-circular></v-flex>
	</v-layout>
	<v-data-table
		v-model="selected"
		select-all item-key="mid"
		:headers="headers"
		:items="owners"
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
				<template v-if="props.item.face">
					<v-avatar size="28" class="pr-2">
						<img :src="props.item.face" :alt="props.item.name">
					</v-avatar>
					{{ props.item.name }}&#60;{{ props.item.mid }}&#62;
				</template>
				<template v-else>&#60;403|404|502&#62;</template>
			</td>
			<td>
				<template v-if="typeof props.item.sign === 'undefined'">&#60;403|404|502&#62;</template>
				<template v-else-if="(props.item.sign || '').length > 0">{{props.item.sign}}</template>
				<template v-else>没有简介</template>
			</td>
			<td>
				<template v-if="props.item.official">
					{{ props.item.official.title }}<br/>
					<p>{{ props.item.official.desc }}</p>
				</template>
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
						<v-btn @click.prevent.stop="midTextareaDialog = true" color="primary" dark>
							添加用户ID
							<v-icon right dark>add</v-icon>
						</v-btn>
					</v-flex>
					<v-flex xs3 d-flex>
						<v-btn @click.prevent.stop="deleteMid" color="primary" dark>
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
	<v-dialog max-width="350px" v-model="midTextareaDialog">
		<v-card>
			<v-card-title><span class="headline">添加视频ID</span></v-card-title>
			<v-card-text>
				<v-textarea ref="midTextarea" v-model="midTextarea" :rules="[rules.mid]" label="使用英文符号<;>来间隔每个视频ID"></v-textarea>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color="primary" @click="addMid(midTextarea)">添加到屏蔽列表</v-btn>
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
export default class AVBlockerOwnerSection extends Storageable {
	public name: string = 'avblockerOwnerSection';

	@Prop({ type: String, required: true }) public section!: string;

	public headers = [
		{ text: 'up主', align: 'left', sortable: true, value: 'mid' },
		{ text: '个人简介', align: 'left', sortable: false },
		{ text: '官方认证', align: 'left', sortable: false },
	];
	public pagination = {
		sortBy: 'mid',
		descending: true,
		rowsPerPage: 10,
	};
	public rules = {
		max8chars: (v: number | string) => {
			if (typeof v === 'undefined') return true;
			return String(v).length <= 8 || '我相信B站用户数量还没到达9位数';
		},
		mid: v => /^[0-9;\n]*$/.test(v || '') || '只允许输入数字、换行符以及分隔符<;>',
	};

	public loaded: boolean = false;
	public blocklist: joybook.avblocker.BlockList = {} as any;
	public owners: bili.UserInfo[] = [];
	public selected: bili.UserInfo[] = [];
	public midTextareaDialog: boolean = false;
	public midTextarea: string = '';

	public toggleAll() {
		if (this.selected.length) this.selected = [];
		else this.selected = this.owners.slice();
	}

	public changeSort(column) {
		if (this.pagination.sortBy === column) {
			this.pagination.descending = !this.pagination.descending;
		} else {
			this.pagination.sortBy = column;
			this.pagination.descending = false;
		}
	}

	public changeMid(mid: number) {
		const elem = document.querySelector(`[data-mid="${mid}"]`) as HTMLInputElement;
		const replaceMid = Number(elem.value);
		// continue or not?
		if (
			!elem ||
			isNaN(replaceMid) ||
			!this.uniqueCheck(this.blocklist.owner, replaceMid) ||
			typeof this.rules.max8chars(replaceMid) === 'boolean' ? false : true
		) return;

		const exist = this.blocklist.owner.indexOf(Number(mid));
		exist !== -1 && this.blocklist.owner.splice(exist, 1, replaceMid);
		this.syncOwners(this.blocklist);
		this.syncBlocklist(this.blocklist);
	}

	public addMid(value: string) {
		value = value.replace('\n', '');
		if (String(value).length <= 0) return;

		if ((this.$refs.midTextarea as any).validate() && Object.keys(this.blocklist).length > 0) {
			for (const mid of value.split(';')) {
				if (mid.length <= 0) continue;
				// 如果没有重复
				if (this.blocklist.owner.indexOf(Number(mid)) < 0) {
					this.blocklist.owner.push(Number(mid));
				}
			}
			this.closeAidTextareaDialog();
			this.clearTextarea();
			this.syncOwners(this.blocklist);
			this.syncBlocklist(this.blocklist);
		}
	}

	public deleteMid() {
		const midToDelete = this.selected.map(v => v.mid);

		for (const mid of midToDelete) {
			const exist = this.blocklist.owner.indexOf(mid);
			exist !== -1 && this.blocklist.owner.splice(exist, 1);
		}
		this.syncOwners(this.blocklist);
		this.syncBlocklist(this.blocklist);
	}

	public uniqueCheck(midlist: number[], mid: number) {
		return midlist.indexOf(mid) === -1;
	}

	public clearTextarea() {
		this.midTextarea = '';
	}

	public closeAidTextareaDialog() {
		this.midTextareaDialog = false;
	}

	public syncBlocklist(blocklist: joybook.avblocker.BlockList) {
		return this.storage.set(config.storageOptions.area, `${config.storageOptions.location}.${this.section}`, blocklist);
	}

	public syncOwners(blocklist: joybook.avblocker.BlockList) {
		const owners = this.storage.get<joybook.avblocker.OwnersCache>('local', 'Owners') || {};
		const Q: Array<Promise<bili.AccountData>> = [];
		for (const mid of blocklist.owner) {
			if (owners[mid] && Object.keys(owners[mid]).length >= 1) continue;
			Q.push(
				this.axios.get<bili.AccountData>(`https://api.bilibili.com/x/space/acc/info?mid=${mid}`)
					.then(res => res.data)
					.then(res => {
						switch (Math.abs(Number(res.code))) {
							case 0:
								return Promise.resolve(res);
							case 404:
							default:
								owners[mid] = { mid } as any;
								this.storage.set('local', `Owners.${mid}`, owners[mid]) as any;
								return Promise.resolve(null as any);
						}
					}),
			);
		}
		return Promise.all(Q)
			.then(result => {
				console.log(result);
				const Q: Array<Promise<any>> = [];
				for (const owner of result) {
					if (!owner) continue;
					Q.push(this.storage.set('local', `Owners.${owner.data.mid}`, owner.data));
				}
				return Promise.all(Q);
			})
			.then(() => {
				this.owners =
					Object.values<bili.UserInfo>(this.storage.get('local', 'Owners', []))
						.filter(v => blocklist.owner.includes(v.mid));
			});
	}

	public created() {
		this.storage.once('ready', () => {
			this.blocklist = this.storage.get<joybook.avblocker.BlockList>(config.storageOptions.area, `${config.storageOptions.location}.${this.section}`);
			this.syncOwners(this.blocklist)
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
