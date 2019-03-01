import '@/plugins/axios';
import '@/plugins/vuetify';
import Vue from 'vue';
import 'vuetify/src/stylus/app.styl';
import Popup from './popup.vue';

Vue.config.productionTip = false;

new Vue({
	render: h => h(Popup),
}).$mount('#app');
