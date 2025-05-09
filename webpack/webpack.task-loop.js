const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './renderer/src/components/main-panel/chat/core/task-loop-sdk.ts',
  output: {
    path: path.resolve(__dirname, '../openmcp-sdk'),
    filename: 'task-loop-sdk.js',
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
    minimizer: [
      new TerserPlugin({
        extractComments: false, // 禁用提取许可证文件
      }),
    ],
  },
  externals: {
    vue: 'vue', // 不打包 vue 库
  },
};