const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './node_modules/tesseract.js/src/worker-script/node/index.js',
  output: {
    path: path.resolve(__dirname, '..', 'resources', 'ocr'),
    filename: 'worker.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    fallback: {
      bufferutil: false,
      'utf-8-validate': false
    }	
  },
  mode: 'production',
  target: 'node',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '..', 'node_modules', 'tesseract.js-core', 'tesseract*'),
          to: path.resolve(__dirname, '..', 'resources', 'ocr', '[name][ext]'),
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