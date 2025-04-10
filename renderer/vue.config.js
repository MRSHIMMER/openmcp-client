const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
    transpileDependencies: true,
    publicPath: process.env.NODE_ENV === 'production' ? '' : '/',
    configureWebpack: {
        optimization: {
            splitChunks: false
        }
    },
    chainWebpack: config => {
        // 删除所有预设的代码分割规则
        config.optimization.delete('splitChunks');

        // 确保路由组件同步加载
        config.plugins.delete('prefetch');
        config.plugins.delete('preload');
    },
    css: {
        extract: false
    }
});
