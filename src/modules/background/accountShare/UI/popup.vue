<template>
<v-card flat v-if="render">
	<v-container class="pa-2" fill-height fluid grid-list-xs>
		<v-layout row wrap justify-center>
			<v-flex
				xs4
				d-flex
				:class="['justify-center', 'align-center', 'account']"
				:style="{ flexDirection: 'column' }"
			>
				<v-tooltip top>
						<v-avatar slot="activator">
							<img v-if="beneficiaryAccount" :src="beneficiaryAccount.face">
							<img v-else src="@/assets/img/svg/twotone-sentiment_dissatisfied-24px.svg">
						</v-avatar>
						<span> 你的账号 </span>
				</v-tooltip>

				<span v-if="beneficiaryAccount" class="text-no-wrap"> {{beneficiaryAccount.uname}} </span>
				<span v-else>
					<v-tooltip bottom>
						<v-btn slot="activator" flat round small @click.prevent="useCurrentLoginAccountAs('beneficiary')">使用当前账号</v-btn>
						<span>这将会清空当前B站cookies</span>
					</v-tooltip>
				</span>
			</v-flex>

			<template v-if="beneficiaryAccount">
			<v-flex
				xs4
				:style="{ flex: '0 0 auto' }"
				d-flex
				:class="['justify-center', 'align-center']"
			>
				<v-btn icon small @click="clearAccount">
					<img src="@/assets/img/svg/twotone-delete-24px.svg">
				</v-btn>
			</v-flex>

			<v-flex
				xs4
				d-flex
				:class="['justify-center', 'align-center', 'account']"
				:style="{ flexDirection: 'column' }"
			>
				<v-tooltip top>
						<v-avatar slot="activator">
							<img v-if="vipAccount" :src="vipAccount.face">
							<img v-else src="@/assets/img/svg/twotone-sentiment_dissatisfied-24px.svg">
						</v-avatar>
						<span> 拥有大会员的账号 </span>
				</v-tooltip>

				<span v-if="vipAccount" class="text-no-wrap"> {{vipAccount.uname}} </span>
				<span v-else>
					<v-tooltip bottom>
						<v-btn slot="activator" flat round small @click.prevent="useCurrentLoginAccountAs('vip')">使用当前账号</v-btn>
						<span>这将会清空当前B站cookies</span>
					</v-tooltip>
				</span>
			</v-flex>
			</template>
		</v-layout>
	</v-container>
</v-card>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import ChromeAsyncCookies from '@/utils/chrome/cookies';
import ChromeAsyncStorage from '@/utils/chrome/storage';
import ChromeAsyncTabs from '@/utils/chrome/tabs';
import config from '../config';

@Component
export default class AccountSharePUI extends Vue {
	public isMounted: boolean = false;
	public chromeStorage: ChromeAsyncStorage = new ChromeAsyncStorage();
	public chromeCookies: ChromeAsyncCookies = new ChromeAsyncCookies({});
	public chromeTabs: ChromeAsyncTabs = new ChromeAsyncTabs();
	public render: boolean = true;

	get beneficiaryAccount() {
		if (!this.isMounted) return false;
		return this.chromeStorage.get(config.storageOptions.area, `module.${config.name}.database.account.beneficiary.data`);
	}

	get vipAccount() {
		if (!this.isMounted) return false;
		return this.chromeStorage.get(config.storageOptions.area, `module.${config.name}.database.account.vip.data`);
	}

	public clearAccount() {
		this.chromeStorage.remove(config.storageOptions.area, `module.${config.name}.database.account`);
	}

	public useCurrentLoginAccountAs(type: 'beneficiary' | 'vip') {
		const cookies = this.chromeCookies.cookies.filter(v => ['stardustvideo', 'stardustpgcv', 'CURRENT_QUALITY', 'CURRENT_FNVAL'].indexOf(v.name) === -1);
		this.fetchAccountDetails(type)
			.then(() => this.chromeStorage.set(config.storageOptions.area, `module.${config.name}.database.account.${type}.cookies`, cookies))
			.then(() => this.chromeCookies.removeAll('https://www.bilibili.com'))
			.then(async () => {
				if (this.beneficiaryAccount && this.vipAccount) {
					const cookies = this.chromeStorage.get<chrome.cookies.Cookie[]>(config.storageOptions.area, `module.${config.name}.database.account.beneficiary.cookies`);
					return this.chromeCookies.setAll(cookies, 'https://www.bilibili.com');
				}
				return Promise.resolve();
			})
			.then(() => this.chromeTabs.query({ url: '*://www.bilibili.com/', highlighted: true }))
			.then(tabs => {
				tabs.forEach(tab => {
					this.chromeTabs.reload(tab.id);
				});
				return Promise.resolve();
			})
			.catch(error => {
				throw error;
			});
	}

	public fetchAccountDetails(type: 'beneficiary' | 'vip') {
		return new Promise((resolve, reject) => {
			this.axios.get<bili.NavData>(`https://api.bilibili.com/x/web-interface/nav?ts=${Date.now()}`)
				.then(result => result.data)
				.then(accDetails => {
					console.log(accDetails);
					if (!accDetails.data.isLogin) return reject(accDetails.message);
					this.chromeStorage.set(config.storageOptions.area, `module.${config.name}.database.account.${type}.data`, accDetails.data)
						.then(resolve);
				});
		});
	}

	public deleteAccountCookies() {
		this.chromeStorage.remove(config.storageOptions.area, `module.${config.name}.database.account.beneficiary`)
			.then(() => this.chromeStorage.remove(config.storageOptions.area, `module.${config.name}.database.account.vip`))
			.catch(e => {
				throw new Error(e);
			});
	}

	public created() {
		this.chromeStorage.once('ready', () => {
			// 如果模块没有开启 不渲染此DOM
			const status = this.chromeStorage.get(config.storageOptions.statusArea, `module.${config.name}.status`);
			if (status === 'off') {
				this.render = false;
			}
		});
		this.chromeStorage.init();
	}

	public async mounted() {
		this.chromeCookies = await new ChromeAsyncCookies({ url: 'https://www.bilibili.com' });
		this.isMounted = true;
	}
}
</script>
