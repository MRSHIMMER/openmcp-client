// esbuild.config.js
const { build } = require('esbuild');

build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/extension.cjs.js',
  sourcemap: true,
  external: ['vscode'], // 只排除 vscode，其他依赖全部打包进来
  target: ['node18'],   // 你可以根据实际 node 版本调整
  loader: {
    '.json': 'json'
  }
}).catch(() => process.exit(1));