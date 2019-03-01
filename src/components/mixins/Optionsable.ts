import { ModuleConstructor } from '@/lib/Module';
import { VueConstructor } from 'vue';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class Settings extends Vue {
	@Prop(Object) public configuration!: { [index: string]: ModuleConstructor };
	@Prop(Object) public optionsInterface!: { [index: string]: VueConstructor };
}
