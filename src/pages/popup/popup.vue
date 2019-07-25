<script lang='ts'>
import { CreateElement, VNode } from 'vue';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { POPUPUI } from '../../modules';
import Footer from '@/components/popupFooter.vue';

@Component
export default class Popup extends Vue {

	public render(h: CreateElement) {
		const children: VNode[] = [];
		for (const key in POPUPUI) {
			Vue.component(key, POPUPUI[key]);
			children.push(h(key));
		}
		children.push(h(Footer));
		return h('v-app', {}, children);
	}
}
</script>

<style lang='scss'>
// :root {
// 	--font-family-sans-serif: -apple-system, BlinkMacSystemFont, 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif, "Microsoft Yahei";
// 	--font-family-monospace: Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
// }

html,
body {
	max-height: max-content;
	width: 100%;
	min-width: 180px;
	margin: 0;
	padding: 0;
	// override Vuetify overflow-y: scroll
	// overflow: auto !important;
}

.application--wrap {
	min-height: 0 !important;
}

// Override with Vuetify font-family
:not(.v-icon) {
	font-family: var(--font-family-sans-serif) !important;
}

:not(input):not(textarea) {
	&,
	&::after,
	&::before {
		-webkit-user-select: none;
		user-select: none;
		cursor: inherit;
	}
}

#nav {
	&::after {
		bottom: -5px;
		content: '';
		height: 5px;
		left: 0px;
		opacity: 1;
		pointer-events: none;
		position: absolute;
		right: 0px;
		width: 100%;
		box-shadow: inset 0px 4px 8px -3px rgba(17, 17, 17, .15);
	}

	.v-toolbar__content {
		padding: 0;
		padding-left: 8px;
	}
}

.account {
	&:hover {
		.v-avatar {
			& > img {
				transform: scale(1.3);
			}
		}
	}

	.v-avatar {
		overflow: hidden;

		& > img {
			transition: transform .3s ease;
		}
	}
}
</style>
