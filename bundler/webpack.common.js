const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = {
    entry: {
        main: path.resolve(__dirname, '../src/script.js'),
        catalog: path.resolve(__dirname, '../src/catalog.js'),
        garderob: path.resolve(__dirname, '../src/garderob.js'),
        auth: path.resolve(__dirname, '../src/auth.js'),
        reg: path.resolve(__dirname, '../src/reg.js'),
        admin: path.resolve(__dirname, '../src/admin.js'),
        cart: path.resolve(__dirname, '../src/cart.js'),
        favourites: path.resolve(__dirname, '../src/favourites.js')
      },
    output:
    {
        hashFunction: 'xxhash64',
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, '../dist'),
    },
    devtool: 'source-map',
    plugins:
    [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../static'),
                    noErrorOnMissing: true
                }
            ]
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/index.html'),
            minify: true,
            chunks: ['main'],
            filename: 'index.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/catalog.html'),
            minify: true,
            chunks: ['catalog'],
            filename: 'catalog.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/garderob.html'),
            minify: true,
            chunks: ['garderob'],
            filename: 'garderob.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/auth.html'),
            minify: true,
            chunks: ['auth'],
            filename: 'auth.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/reg.html'),
            minify: true,
            chunks: ['reg'],
            filename: 'reg.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/admin.html'),
            minify: true,
            chunks: ['admin'],
            filename: 'admin.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/cart.html'),
            minify: true,
            chunks: ['cart'],
            filename: 'cart.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/favourites.html'),
            minify: true,
            chunks: ['favourites'],
            filename: 'favourites.html',
          }),
        new MiniCSSExtractPlugin()
    ],
    module:
    {
        rules:
        [
            {
                test: /\.(html)$/,
                use:
                [
                    'html-loader'
                ]
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use:
                [
                    'babel-loader'
                ]
            },
            {
                test: /\.css$/,
                use:
                [
                    MiniCSSExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.(jpg|png|gif|svg)$/,
                type: 'asset/resource',
                generator:
                {
                    filename: 'assets/images/[hash][ext]'
                }
            },
            {
                test: /\.(ttf|eot|woff|woff2)$/,
                type: 'asset/resource',
                generator:
                {
                    filename: 'assets/fonts/[hash][ext]'
                }
            }
        ]
    }
};