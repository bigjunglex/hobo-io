import MiniCssExtractPlugin from "mini-css-extract-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "node:path";

export default {
	entry: {
		game: './src/client/index.ts',
	},
	output: {
		filename: '[name].[contenthash].js',
		path: path.resolve('dist-client'),
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: 'ts-loader',
			},
			{
				test: /\.css$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
					},
					'css-loader',
				],
			},
		],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].[contenthash].css',
		}),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: 'src/client/html/index.html',
		}),
	],
};