import '@/plugins/vue-router';
import '@/plugins/vuetify';
import '@/plugins/axios';
import '@/plugins/google-analytics.js';
import Vue from 'vue';
import VueRouter from 'vue-router';
import 'vuetify/src/stylus/app.styl';
import Options from './options.vue';
import router from './router';

import { CONFIGURATION, OPTIONUI } from '../../modules';

Vue.config.productionTip = false;

Vue.use(VueRouter);

Vue.prototype.configuration = CONFIGURATION;
Vue.prototype.optionsInterface = OPTIONUI;

new Vue({
	router,
	render: h => h(Options),
}).$mount('#app');
