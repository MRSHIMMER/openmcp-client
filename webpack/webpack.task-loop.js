import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';

// 适配 ESM 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 统一路径变量
const rootDir = resolve(__dirname, '..');
const srcDir = resolve(rootDir, 'renderer/src');
const outDir = resolve(rootDir, 'openmcp-sdk');

export default {
  mode: 'development',
  devtool: 'source-map',
  entry: resolve(srcDir, 'components/main-panel/chat/core/task-loop.ts'),
  output: {
    path: outDir,
    filename: 'task-loop.js',
    libraryTarget: 'commonjs', // 改为 ESM 兼容的 commonjs 格式 [[9]]
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': srcDir,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: resolve(rootDir, 'tsconfig.json'),
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'null-loader',
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      window: {
        nodejs: true,
        navigator: {
          userAgent: 2,
        },
        performance: {
          now: () => Date.now(),
        },
      },
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve(rootDir, 'resources/openmcp-sdk-release'),
          to: outDir,
        },
      ],
    }),
  ],
  externals: {
    vue: 'vue',
    'element-plus': './tools.js', // 使用 POSIX 风格路径 [[6]]
  },
};