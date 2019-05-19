const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

const resolve = (mdir, dir) => path.join(__dirname, mdir, dir);

module.exports = {
	pages: {
		popup: {
			entry: 'src/pages/popup/index.ts',
			template: 'public/index.html',
			filename: 'popup.html',
			// chunks: ['js/chunks-vendors', 'popup']
		},
		options: {
			entry: 'src/pages/options/index.ts',
			template: 'public/index.html',
			filename: 'options.html',
			// chunks: ['chunks-vendors', 'options']
		}
	},

	filenameHashing: false,

	configureWebpack: {
		// entry: {
		// 	'chunks-vendors': ['vue', 'vue-router', 'vuetify'],
		// },
		// externals: {
		// 	vue: 'vue',
		// 	vueRouter: 'vue-router',
		// 	vuetify: 'vuetify',
		// },
		devtool: process.env.NODE_ENV === 'production' ? 'none' : 'eval-source-map',
		// devtool: 'eval-source-map',
		resolve: {
			alias: {
				'@': resolve('src', './'),
				'@public': resolve('public', './'),
			},
		},
		plugins: [
			new CopyWebpackPlugin([
				{
					from: path.join(__dirname, './src/manifest.json'),
					to: path.join(__dirname, './dist/'),
				},
			]),
		],
	},

	css: {
		sourceMap: !process.env.NODE_ENV === 'production',
	},

	pluginOptions: {
		browserExtension: {
			registry: undefined,
			components: {
				background: true,
				popup: true,
				contentScripts: true,
				options: true,
			},
			api: 'browser',
			usePolyfill: false,
			autoImportPolyfill: false,
			componentOptions: {
				background: {
					entry: 'src/scripts/background.ts',
				},
				contentScripts: {
					entries: {
						'js/contentscript': [
							'src/scripts/contentscript.ts',
						],
						'js/injection': [
							'src/scripts/injection.ts',
						],
						'js/collectInjection': [
							'src/scripts/collectInjection.ts',
						],
						'js/inject': [
							'src/scripts/inject.ts',
						],
					},
				}
			}
		}
	}
};
