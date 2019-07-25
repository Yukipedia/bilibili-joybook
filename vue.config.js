const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const package = require('./package.json');

const resolve = (mdir, dir) => path.join(__dirname, mdir, dir);

module.exports = {
	pages: {
		popup: {
			entry: 'src/pages/popup/index.ts',
			template: 'public/index.html',
			filename: 'popup.html',
			chunks: ['chunk-vendors', 'popup']
		},
		options: {
			entry: 'src/pages/options/index.ts',
			template: 'public/index.html',
			filename: 'options.html',
			chunks: ['chunk-vendors', 'options']
		},
		background: {
			entry: 'src/scripts/background.ts',
			template: 'public/index.html',
			filename: 'background.html',
			chunks: ['chunk-vendors', 'background']
		}
	},

	filenameHashing: false,

	configureWebpack: {
		devtool: process.env.NODE_ENV === 'production' ? 'none' : 'eval-source-map',
		resolve: {
			alias: {
				'@': resolve('src', './'),
				'@public': resolve('public', './'),
			},
		},
		entry: {
			'js/inject': path.resolve(__dirname, './src/scripts/inject.ts'),
			'js/microhost': path.resolve(__dirname, './src/modules/background/giovanni/microhost.ts'),
		},
		output: {
			chunkFilename: 'js/[name].js',
		},
		optimization: {
			splitChunks: {
				cacheGroups: {
					vendors: {
						// 只让符合条件的entry进行分包
						// 当前还没有写入文档的功能 https://github.com/webpack/webpack/pull/6791
						chunks: chunk => ['popup', 'options', 'background', 'js/inject'].includes(chunk.name),
						test: /node_modules/,
						name: 'chunk-vendors',
						reuseExistingChunk: true,
						enforce: true
					}
				}
			}
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
				background: false,
				popup: true,
				contentScripts: true,
				options: true,
			},
			api: 'browser',
			usePolyfill: false,
			autoImportPolyfill: false,
			componentOptions: {
				// background: {
				// 	entry: 'src/scripts/background.ts',
				// },
				contentScripts: {
					entries: {
						// 'js/contentscript': [
						// 	'src/scripts/contentscript.ts',
						// ],
						'js/injection': [
							'src/scripts/injection.ts',
						],
						'js/collectInjection': [
							'src/scripts/collectInjection.ts',
						],
						// 'js/inject': [
						// 	'src/scripts/inject.ts',
						// ],
					},
				}
			}
		}
	}
};
