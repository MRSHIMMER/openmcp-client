import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

// 适配 ESM 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 统一路径变量
const rootDir = resolve(__dirname, '..');
const outDir = resolve(rootDir, 'resources', 'ocr');

export default {
  entry: resolve(rootDir, 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js'),
  output: {
    path: outDir,
    filename: 'worker.js',
    libraryTarget: 'commonjs', // 改为 ESM 兼容的 commonjs 格式
  },
  resolve: {
    fallback: {
      bufferutil: false,
      'utf-8-validate': false,
    },
  },
  mode: 'production',
  target: 'node',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve(rootDir, 'node_modules', 'tesseract.js-core', 'tesseract*'),
          to: resolve(outDir, '[name][ext]'),
        },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};