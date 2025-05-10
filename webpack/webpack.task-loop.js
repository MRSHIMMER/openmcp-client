const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    mode: 'development', // 设置为 development 模式
    devtool: 'source-map', // 生成 source map 以便调试
    entry: './renderer/src/components/main-panel/chat/core/task-loop.ts',
    output: {
        path: path.resolve(__dirname, '../openmcp-sdk'),
        filename: 'task-loop.js',
        libraryTarget: 'commonjs2'
    },
    target: 'node',
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, '../renderer/src'), // 修正路径别名
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.vue$/,
                use: {
                    loader: 'null-loader'
                }
            }
        ],
    },
    optimization: {
        minimize: false, // 禁用代码压缩
        minimizer: [
            new TerserPlugin({
                extractComments: false, // 禁用提取许可证文件
            }),
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            window: {
                nodejs: true,
                navigator: {
                    userAgent: 2
                },
                performance: {
                    now: () => Date.now()
                }
            }
        }),
    ],
    externals: {
        vue: 'vue', // 不打包 vue 库
        'element-plus': './tool.js'
    },
};