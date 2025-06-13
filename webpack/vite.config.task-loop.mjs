import { defineConfig, normalizePath } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// 统一定义根目录，确保路径一致性
const rootDir = resolve(__dirname, '..');
const srcDir = resolve(rootDir, 'renderer/src');
const outDir = resolve(rootDir, 'openmcp-sdk');

export default defineConfig({
  define: {
    'window': {
      'nodejs': true,
      'navigator': {
        'userAgent': 2
      },
      'performance': {
        'now': () => performance.now()
      },
      'Date': {
        'now': () => Date.now()
      }
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          // 使用统一路径处理逻辑
          src: normalizePath(resolve(rootDir, 'resources/openmcp-sdk-release/*')),
          dest: normalizePath(outDir)
        }
      ]
    })
  ],
  build: {
    target: 'node18',
    lib: {
      // 使用统一路径变量
      entry: resolve(srcDir, 'components/main-panel/chat/core/task-loop.ts'),
      name: 'TaskLoop',
      fileName: 'task-loop',
      formats: ['es'] // 改为 ESM 格式 [[7]]
    },
    outDir, // 使用统一输出目录
    emptyOutDir: false,
    rollupOptions: {
      external: [
        'vue',
        'chalk',
        'element-plus',
      ],
      output: {
        globals: {
          vue: 'vue',
          chalk: 'chalk',
          'element-plus': './tools.js' // 使用 POSIX 风格路径 [[10]]
        },
        esModule: true
      }
    },
    minify: false,
    sourcemap: false
  },
  resolve: {
    alias: {
      // 使用统一路径变量
      '@': srcDir
    }
  }
});