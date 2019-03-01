import ChromeAsyncStorage from '@/utils/chrome/storage';
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Toggleable extends Vue {
	public storage: ChromeAsyncStorage = new ChromeAsyncStorage();

	public mounted() {
		this.storage.init();
	}
}
