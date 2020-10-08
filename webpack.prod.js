const { resolve } = require('path');
const rxPaths = require('rxjs/_esm5/path-mapping');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const { CleanCssWebpackPlugin } = require('@angular-devkit/build-angular/src/angular-cli-files/plugins/cleancss-webpack-plugin');
const { AngularCompilerPlugin } = require('@ngtools/webpack');
const { IndexHtmlWebpackPlugin } = require('@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin');
const { SuppressExtractedTextChunksWebpackPlugin } = require('@angular-devkit/build-angular/src/angular-cli-files/plugins/suppress-entry-chunks-webpack-plugin');
const { HashedModuleIdsPlugin } = require('webpack');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');

process.env.BUILD_VERSION = new Date().getTime();
const PVROOT = process.env.pvroot || "";
const BASEURN = PVROOT;
OUTPATH_PREFIX = '';
var ASSETS_PREFIX = '';
var GEN_SOURCEMAP = true;
if (process.env.daot) {
	ASSETS_PREFIX = '/lab';
	OUTPATH_PREFIX = 'lab/';
	GEN_SOURCEMAP = false;
}
const SOURCEMAP_LOCATION = process.env.daot && OUTPATH_PREFIX + 'js' || 'sourcemap';

module.exports = {

	mode: 'production',

	devtool: 'source-map',

	entry: ["./src/styles.scss", "./src/polyfills.ts", "./src/main.ts"],

	output: {
		publicPath: "/",
		path: resolve('./dist'),
		filename: OUTPATH_PREFIX + 'js/[name].' + process.env.BUILD_VERSION + '.[chunkhash].bundle.js',
		sourceMapFilename: SOURCEMAP_LOCATION + '[name].' + process.env.BUILD_VERSION + '.[chunkhash].bundle.map',
		chunkFilename: OUTPATH_PREFIX + 'js/[id].' + process.env.BUILD_VERSION + '.[chunkhash].chunk.js'
	},

	resolve: {
		extensions: ['.ts', '.js'],
		alias: rxPaths()
	},

	node: false,

	performance: {
		hints: false,
	},

	module: {
		rules: [
			{
				test: /\.ts$/,
				use: '@ngtools/webpack'
			},
			{
				test: /\.js$/,
				loader: '@angular-devkit/build-optimizer/webpack-loader',
				options: { sourceMap: true }
			},
			{
				test: /\.js$/,
				exclude: [
					/(ngfactory|ngstyle).js$/,
					/node_modules\/@agm\/core/
				],
				enforce: 'pre',
				use: 'source-map-loader'
			},
			{
				test: /\.html$/,
				use: 'raw-loader',
				exclude: /index.html$/
			},
			{
				test: /\.scss$/,
				use: ['to-string-loader', 'css-loader', 'sass-loader'],
				exclude: [resolve('./src/styles.scss')]
			},
			{
				test: /\.scss$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
				include: [resolve('./src/styles.scss')]
			},
			{
				test: /\.(eot|svg|cur)$/,
				loader: 'file-loader',
				options: {
					name: OUTPATH_PREFIX + 'assets/static/' + '[name].[ext]',
					limit: 10000
				}
			},
			{
				test: /\.(jpg|png|webp|gif|otf|ttf|woff|woff2|ani)$/,
				loader: 'url-loader',
				options: {
					name: OUTPATH_PREFIX + 'assets/static/' + '[name].[ext]',
					limit: 10000
				}
			},

			// This hides some deprecation warnings that Webpack throws
			{
				test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
				parser: { system: true },
			}
		]
	},

	optimization: {
		noEmitOnErrors: true,
		runtimeChunk: 'single',
		splitChunks: {
			cacheGroups: {
				default: {
					chunks: 'async',
					minChunks: 2,
					priority: 10
				},
				common: {
					name: 'common',
					chunks: 'async',
					minChunks: 2,
					enforce: true,
					priority: 5
				},
				vendors: false,
				vendor: false
			}
		},
		minimizer: [
			new HashedModuleIdsPlugin(),
			new UglifyJSPlugin({
				sourceMap: GEN_SOURCEMAP,
				cache: true,
				parallel: true,
				uglifyOptions: {
					keep_fnames: false,
					safari10: true,
					output: {
						ascii_only: true,
						comments: false,
						webkit: true,
					},
					compress: {
						pure_getters: true,
						passes: GEN_SOURCEMAP && 3 || 1,
						inline: GEN_SOURCEMAP && 3 || 1,
					}
				}
			}),
			new CleanCssWebpackPlugin({
				sourceMap: true,
				test: (file) => /\.(?:scss)$/.test(file),
			})
		]
	},

	plugins: [
		new HtmlWebpackPlugin({
			template: resolve('./src/index.html'),
			xhtml: true,
			PVROOT: PVROOT,
			BASEURN: BASEURN,
			BUILD_VERSION: process.env.BUILD_VERSION,
			chunksSortMode: 'none'
		}),

		new AngularCompilerPlugin({
			mainPath: resolve('./src/main.ts'),
			sourceMap: true,
			nameLazyFiles: false,
			tsConfigPath: resolve('./src/tsconfig.app.json'),
			skipCodeGeneration: false,
			hostReplacementPaths: {
				[resolve('src/environments/environment.ts')]: resolve('src/environments/environment.prod.ts')
			}
		}),

		new MiniCssExtractPlugin({
			filename: OUTPATH_PREFIX + 'assets/css/' + "[name].[hash].css",
			chunkFilename: OUTPATH_PREFIX + 'assets/css/' + "[id].[hash].css"
		}),

		new SuppressExtractedTextChunksWebpackPlugin(),

		new ProgressPlugin(),

		new CircularDependencyPlugin({
			exclude: /[\\\/]node_modules[\\\/]/
		}),

		new CopyWebpackPlugin([
			{
				from: 'src/assets',
				to: OUTPATH_PREFIX + 'assets'
			},
		]),

		new ReplaceInFileWebpackPlugin([{
			dir: './dist',
			test: [/\.js$/, /\.html$/, /\.css$/, /\.scss$/, /\.map$/, /\.json$/],
			rules: [
				{
					search: /\@ASSETS_PREFIX/g,
					replace: ASSETS_PREFIX
				}

			]
		}]),
	]
};
