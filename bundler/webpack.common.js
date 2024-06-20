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
        favourites: path.resolve(__dirname, '../src/favourites.js'),
        admin: path.resolve(__dirname, '../src/admin/admin.js'),
        cart: path.resolve(__dirname, '../src/cart.js'),
        product_overview: path.resolve(__dirname, '../src/product_overview.js'),
        admin_clothes: path.resolve(__dirname, '../src/admin/admin_clothes.js'),
        admin_styles: path.resolve(__dirname, '../src/admin/admin_styles.js'),
        admin_users: path.resolve(__dirname, '../src/admin/admin_users.js'),
        admin_orders: path.resolve(__dirname, '../src/admin/admin_orders.js'),
        admin_news: path.resolve(__dirname, '../src/admin/admin_news.js'),
        user_profile: path.resolve(__dirname, '../src/user_profile.js'),
        styling: path.resolve(__dirname, '../src/styling.js'),
        purchase: path.resolve(__dirname, '../src/purchase.js'),
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
            template: path.resolve(__dirname, '../src/admin/admin.html'),
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
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/product_overview.html'),
            minify: true,
            chunks: ['product_overview'],
            filename: 'product_overview.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/admin/admin_clothes.html'),
            minify: true,
            chunks: ['admin_clothes'],
            filename: 'admin_clothes.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/admin/admin_styles.html'),
            minify: true,
            chunks: ['admin_styles'],
            filename: 'admin_styles.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/admin/admin_users.html'),
            minify: true,
            chunks: ['admin_users'],
            filename: 'admin_users.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/admin/admin_orders.html'),
            minify: true,
            chunks: ['admin_orders'],
            filename: 'admin_orders.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/admin/admin_news.html'),
            minify: true,
            chunks: ['admin_news'],
            filename: 'admin_news.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/user_profile.html'),
            minify: true,
            chunks: ['user_profile'],
            filename: 'user_profile.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/styling.html'),
            minify: true,
            chunks: ['styling'],
            filename: 'styling.html',
          }),
          new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/purchase.html'),
            minify: true,
            chunks: ['purchase'],
            filename: 'purchase.html',
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
            },
            {
              test: /\.(woff|woff2|eot|ttf|otf)$/,
              use: [
                {
                  loader: 'file-loader',
                  options: {
                    name: '[name].[ext]',
                    outputPath: 'fonts/'
                  }
                }
              ]
            }
        ]
    }
};