import '@/plugins/vue-router';
import '@/plugins/vuetify';
import '@/plugins/axios';
import Vue from 'vue';
import VueRouter from 'vue-router';
import 'vuetify/src/stylus/app.styl';
import Options from './options.vue';
import router from './router';

Vue.config.productionTip = false;

Vue.use(VueRouter);

new Vue({
	router,
	render: h => h(Options),
}).$mount('#app');
