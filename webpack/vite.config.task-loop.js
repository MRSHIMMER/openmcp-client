import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
// import { visualizer } from 'rollup-plugin-visualizer';

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
                    src: resolve(__dirname, '../resources/openmcp-sdk-release/*'),
                    dest: resolve(__dirname, '../openmcp-sdk')
                }
            ]
        }),
        // visualizer({
        //     open: true,
        //     filename: 'stats.html'
        // })
    ],
    build: {
        target: 'node18',
        lib: {
            entry: resolve(__dirname, '..', 'renderer/src/components/main-panel/chat/core/task-loop.ts'),
            name: 'TaskLoop',
            fileName: 'task-loop',
            formats: ['cjs']
        },
        outDir: resolve(__dirname, '..', 'openmcp-sdk'),
        emptyOutDir: false,
        rollupOptions: {
            external: [
                'vue',
                'element-plus',
            ],
            output: {
                globals: {
                    vue: 'Vue',
                    'element-plus': './tools.js'
                }
            }
        },
        minify: false,
        sourcemap: false,  // 禁用sourcemap生成
        cssCodeSplit: false  // 禁用CSS文件生成
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, '..', 'renderer/src'),
        }
    }
});