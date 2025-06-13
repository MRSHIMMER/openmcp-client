import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
  input: 'src/extension.ts',
  output: {
    file: 'dist/extension.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
     json(),
    resolve({ browser: true }),  // 支持 node_modules 解析
    commonjs(),                    // 转换 CommonJS 模块
    typescript()                   // 处理 TypeScript
  ],
  external: ['vscode'],           // 排除 VSCode 内置模块
  onwarn(warning, warn) {
    if (warning.code !== 'SOURCEMAP_ERROR') warn(warning);
  }
};