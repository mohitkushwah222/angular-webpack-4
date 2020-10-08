const { resolve } = require("path");
const path = require("path");
const rxPaths = require("rxjs/_esm5/path-mapping");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ProgressPlugin = require("webpack/lib/ProgressPlugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CircularDependencyPlugin = require("circular-dependency-plugin");
const { AngularCompilerPlugin } = require("@ngtools/webpack");
var mime = require('mime-types');
const {
	IndexHtmlWebpackPlugin
} = require("@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin");
const webpack = require('webpack');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');

process.env.BUILD_VERSION = new Date().getTime();
const BASEURN = '/';
const PVROOT = '';
ASSETS_PREFIX = '';
const ERX_RESOURCE_URN = '';

module.exports = {
	mode: "development",

	devtool: "eval",

	entry: ["./src/styles.scss", "./src/polyfills.ts", "./src/main.ts"],
	// entry: {
	// 	styles: "./src/styles.scss",
	// 	polyfills: "./src/polyfills.ts",
	// 	main: "./src/main.ts"
	// },

	output: {
		path: resolve("./dist"),
		filename: "js/[name].js"
	},

	resolve: {
		extensions: [".ts", ".js"],
		alias: rxPaths()
	},

	node: false,

	performance: {
		hints: false
	},

	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "@ngtools/webpack"
			},
			{
				test: /\.js$/,
				exclude: [
					/(ngfactory|ngstyle).js$/,
					/node_modules\/@agm\/core/
				],
				enforce: "pre",
				use: "source-map-loader"
			},
			{
				test: /\.html$/,
				use: "raw-loader",
				exclude: /index.html$/
			},
			{
				test: /\.scss$/,
				use: ["to-string-loader", "css-loader", "sass-loader"],
				exclude: [resolve("./src/styles.scss")]
			},
			{
				test: /\.scss$/,
				use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
				include: [resolve("./src/styles.scss")]
			},
			{
				test: /\.(eot|svg|cur)$/,
				loader: "file-loader",
				options: {
					name: "assets/[name].[ext]",
					limit: 10000
				}
			},
			{
				test: /\.(jpg|png|webp|gif|otf|ttf|woff|woff2|ani)$/,
				loader: "url-loader",
				options: {
					name: "assets/[name].[ext]",
					limit: 10000
				}
			},

			// This hides some deprecation warnings that Webpack throws
			{
				test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
				parser: {
					system: true
				}
			}
		]
	},

	plugins: [

		// new IndexHtmlWebpackPlugin({
		// 	input: "index.html",
		// 	output: "index.html",
		// 	entrypoints: ["styles", "polyfills", "main"]
		// }),

		new HtmlWebpackPlugin({
			template: resolve('./src/index.html'),
			xhtml: true,
			BASEURN: BASEURN,
			BUILD_VERSION: process.env.BUILD_VERSION,
			PVROOT: PVROOT,
			chunksSortMode: 'none'
		}),

		new AngularCompilerPlugin({
			mainPath: resolve("./src/main.ts"),
			sourceMap: true,
			nameLazyFiles: true,
			tsConfigPath: resolve("./src/tsconfig.app.json"),
			skipCodeGeneration: true
		}),

		new MiniCssExtractPlugin({
			filename: "assets/[name].[hash].css",
			chunkFilename: "assets/[id].[hash].css"
		}),

		new ProgressPlugin(),

		new CircularDependencyPlugin({
			exclude: /[\\\/]node_modules[\\\/]/
		}),

		new CopyWebpackPlugin([
			{
				from: "src/assets",
				to: "assets"
			},
			{
				from: "src/favicon.ico"
			}
		]),
		new ReplaceInFileWebpackPlugin([{
			dir: './dist',
			test: [/\.js$/, /\.html$/, /\.css$/, /\.scss$/, /\.map$/, /\.json$/],
			rules: [
				{
					search: /\@ASSETS_PREFIX/g,
					replace: ASSETS_PREFIX
				},
			]
		}]),

	],

	devServer: {
		writeToDisk: true,
		historyApiFallback: true,
		before: function (app, server) {
			app.get('/', function (req, res) {
				fs.createReadStream(
					path.join(__dirname, '..', 'dist', 'index.html')
				).pipe(res);
			});

			var staticResourceStreamCreator = function (req, res, stripOneAsset) {
				// console.log("#### before: ", req.url);
				var resourceURN = req.url;
				if (resourceURN.indexOf('?') != -1) {
					resourceURN = resourceURN.substr(0, resourceURN.indexOf('?'))
				}
				if (stripOneAsset) {
					resourceURN = resourceURN.replace('/assets/', '');
				}
				// console.log("#### after: ", resourceURN);
				var filepath = path.join(__dirname, '..', 'dist', resourceURN);
				if (!fs.existsSync(filepath)) {
					res.status(404).send("Not found.");
					return;
				}
				var mtype = mime.contentType(path.extname(filepath));
				res.setHeader('Content-Type', mtype);
				fs.createReadStream(filepath).pipe(res);
			}
			app.get('/assets/assets/*', function (req, res) {
				staticResourceStreamCreator(req, res, true);
			});

			app.get('/assets/*', function (req, res) {
				staticResourceStreamCreator(req, res, false);
			});

			app.get('/js/*', function (req, res) {
				staticResourceStreamCreator(req, res, false);
			});
		},
		watchOptions: {
			aggregateTimeout: 300,
			poll: 1000
		},

		// https: {
		// 	key: fs.readFileSync(__dirname + ''),
		// 	cert: fs.readFileSync(__dirname + ''),
		// 	ca: fs.readFileSync(__dirname + '')
		// },

		proxy: {
			'/app': {
				target: 'https://local.myserver.com:3500',
				pathRewrite: {
					'^/app': ''
				},
				secure: false
			}
		}

	}
};
