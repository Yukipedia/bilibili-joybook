<script lang='ts'>
import { CreateElement } from 'vue';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { VBtn, VIcon, VToolbar  } from 'vuetify/lib';
import { NavigationGuard, Route } from 'vue-router';

@Component
export default class SettingSubpage extends Vue {
	public name: string = 'settingSubpage';

	@Prop({
		type: String,
		validator: (value: string) => {
			if (typeof value !== 'string' || value.length <= 0) {
				return false;
			}
			return true;
		},
	}) public moduleName!: string;

	public get title() {
		return this.configuration[this.moduleName.toLowerCase()] ? this.configuration[this.moduleName.toLowerCase()].name : '';
	}

	// 如果不存在这个界面组件那就返回主页
	public beforeRouteEnter: NavigationGuard = (to, from, next) => {
		next(vm => {
			if (!vm.optionsInterface[to.params ? to.params.moduleName.toLowerCase() : -1]) {
				vm.$router.replace({ path: '/' });
			}
		});
	}

	public created() {
		if (!this.optionsInterface[this.moduleName.toLowerCase()]) {
			this.$router.replace({ path: '/' });
		}
	}

	public render(h: CreateElement) {
		const backBtnIcon = h(VIcon, {
			domProps: {
				innerText: 'arrow_back',
			},
		});

		const backBtn = h(VBtn, {
			props: { icon: true },
			on: {
				click: () => {
					this.$router.replace('/');
				},
			},
		}, [backBtnIcon]);

		const toolbar = h(VToolbar, {
			props: { flat: true, light: true, height: '48' },
			class: 'pt-2 pb-4',
			style: {
				backgroundColor: 'inherit',
			},
		}, [backBtn, h('h1', { class: 'subheading', domProps: { innerText: `${this.title}` } })]);

		return h('div', { class: 'subpage' }, [toolbar, h(this.optionsInterface[this.moduleName.toLowerCase()])]);
	}
}
</script>

<style lang='scss'>
.subpage {
	& h1.subheading {
		color: var(--subpage-header-line-title-color);
	}
}
</style>
