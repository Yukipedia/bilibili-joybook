import VueRouter, { RawLocation, RouteConfig } from 'vue-router';
import listSettings from './list.vue';
import subpage from './subpage.vue';

const routes: RouteConfig[] = [
	{
		path: '/',
		name: 'setting',
		component: listSettings,
	},
	{
		path: '/redirect',
		name: 'redirect',
		component: listSettings,
	},
	{
		path: '/:moduleName',
		name: 'subpage',
		component: subpage,
		props: true,
	},
	{
		path: '*',
		name: 'redirectToParent',
		redirect: (to): RawLocation => {
			const path = to.path.split('/');

			if (path[path.length - 1] === path[path.length - 2]) {
				path.splice(path.length - 2);
			} else {
				path.pop();
			}

			return { path: path.join('/') };
		},
	},
];

export default new VueRouter({routes});
