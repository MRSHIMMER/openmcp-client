import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// 适配 ESM 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('webpack').Configuration} */
const extensionConfig = {
  target: 'node', // VS Code 扩展运行于 Node.js 环境
  mode: 'none', // 保持代码原样，打包时设为 'production'
  entry: resolve(__dirname, 'src', 'extension.ts'), // 绝对路径
  output: {
    path: resolve(__dirname, 'dist'), // 绝对路径
    filename: 'extension.js',
    libraryTarget: 'module', // 改为 ESM 兼容的模块格式
    chunkFormat: 'module', // 确保分块也是 ESM 格式
  },
  externals: {
    vscode: 'commonjs vscode', // 排除 vscode 模块
    // 其他需排除的依赖（如第三方库）
  },
  experiments: {
    outputModule: true, // 启用 ESM 输出实验性功能
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      bufferutil: false,
      'utf-8-validate': false
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{
          loader: 'ts-loader'
        }]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: 'log'
  }
};

export default [extensionConfig];