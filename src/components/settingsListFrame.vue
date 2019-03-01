<template>
<div class="list-frame">
	<div class="column-header list-item">
		<slot name="header"></slot>
	</div>
	<v-list>
		<v-list-tile v-for="item in 6" :key="item">
			<v-list-tile-content>
				<div class="list-item"></div>
			</v-list-tile-content>
		</v-list-tile>
	</v-list>
</div>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class SettingsListFrame extends Vue {
	public name: string = 'settingsListFrame';
}
</script>

<style lang='scss' scoped>
.list {
	&-frame {
		padding-inline-end: 20px;
		padding-inline-start: 20px + 40px;
		padding-bottom: 0;
		padding-top: 0;
		align-items: center;
		display: block;
	}
	&-item {
		align-items: center;
		display: flex;
		min-height: 48px;
		padding: 0;
	}
}

.column-header {
	color: #5f6368;
	font-size: inherit;
	font-weight: 400;
	padding-inline-end: 36px + 16px;

	& > div {
		display: flex;
		flex: 1;
		align-items: center;
	}
}
</style>
