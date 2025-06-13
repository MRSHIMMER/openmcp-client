import { defineConfig, normalizePath } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// 适配 ESM 的 __filename 和 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 统一定义根目录，确保路径一致性
const rootDir = resolve(__dirname, '..'); // 根目录（与当前文件同级的上级目录）
const srcDir = resolve(rootDir, 'renderer/src'); // 源代码目录
const outDir = resolve(rootDir, 'openmcp-sdk'); // 构建输出目录

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
          // 使用统一路径处理逻辑（POSIX 风格）
          src: normalizePath(resolve(rootDir, 'resources/openmcp-sdk-release/*')),
          dest: normalizePath(outDir) // 目标路径保持 POSIX 风格
        }
      ]
    })
  ],
  build: {
    target: 'node18', // Node.js 18 的目标环境
    lib: {
      // 使用统一路径变量（ESM 兼容格式）
      entry: resolve(srcDir, 'components/main-panel/chat/core/task-loop.ts'),
      name: 'TaskLoop', // 库名称
      fileName: 'task-loop', // 输出文件名
      formats: ['es'] // 改为 ESM 格式 [[7]]
    },
    outDir, // 使用统一输出目录
    emptyOutDir: false, // 不清空输出目录
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
        esModule: true // 强制输出 ESM 格式
      }
    },
    minify: false, // 不压缩代码
    sourcemap: false // 不生成 source map
  },
  resolve: {
    alias: {
      // 使用统一路径变量（ESM 兼容别名）
      '@': srcDir
    },
    extensions: ['.ts', '.js', '.mjs'] // 支持 .mjs 扩展名
  }
});