import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/ocr-worker.ts',
  output: {
    file: 'dist/ocr-worker.js',
    format: 'es'
  },
  plugins: [
    resolve(),
    commonjs()
  ],
  external: ['tesseract.js']  // 显式排除 Tesseract
};