<template>
<div class="settingsToggleButton" actionable>
	<div id="outerRow" class="align-center" :nosublabel="noSublabel">
		<div class="flex" id="labelWrapper">
			<div class="label" aria-hidden="true">{{ label }}</div>
			<div class="secondary label">{{ sublabel }}</div>
		</div>
		<div style="display:block"><v-switch :color="color" :value="value" @change="trigger" hide-details class="mt-0 pt-0"></v-switch></div>
	</div>
</div>
</template>

<script lang='ts'>
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component
export default class SettingsToggleButton extends Vue {
	public name: string = 'settingsToggleButton';

	@Prop(Boolean) public noSublabel!: boolean;
	@Prop(String) public label!: string;
	@Prop(String) public sublabel!: string;
	@Prop(Boolean) public value!: boolean;
	@Prop({ type: String, default: 'primary' }) public color!: string;

	public trigger(value: boolean) {
		this.$emit('trigger', value ? true : false);
	}
}
</script>

<style lang='scss' scoped>
[actionable] {
	cursor: pointer;
}

.settingsToggleButton {
	align-items: center;
	display: flex;
	min-height: 48px;
	padding: 0 20px;
}

.flex {
	flex: 1;
	flex-basis: 0.000000001px;
}

.secondary {
	color: #5f6368;
	font-weight: 400;
	background-color: inherit !important;
	border-color: inherit !important;
}

.label {
	font-size: 13px;
}

#outerRow {
	display: flex;
	min-height: 64px;
	width: 100%;

	&[noSubLabel] {
		min-height: 48px;
	}
}

#labelWrapper {
	padding: 12px 0;
}
</style>
