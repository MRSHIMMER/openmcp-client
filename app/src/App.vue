<template>
	<div class="main">
		<Sidebar></Sidebar>
		<MainPanel></MainPanel>
	</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { Connection } from './components/sidebar/sidebar';

import Sidebar from '@/components/sidebar/index.vue';
import MainPanel from '@/components/main-panel/index.vue';
import { setDefaultCss } from './hook/css';
import { pinkLog } from './views/setting/util';
import { acquireVsCodeApi, useMessageBridge } from './api/message-bridge';
import { connectionArgs, connectionMethods, connectionResult, doConnect } from './views/connect/connection';
import { loadSetting } from './hook/setting';

const bridge = useMessageBridge();

// 监听所有消息
bridge.addCommandListener('hello', data => {
	pinkLog(`${data.name} 上线`);
	pinkLog(`version: ${data.version}`);
}, { once: true });


onMounted(() => {
    // 初始化 css
	setDefaultCss();

	document.addEventListener('click', () => {
		Connection.showPanel = false;
	});

	pinkLog('OpenMCP Client 启动');

    // 如果是 debug 模式，直接连接项目中的服务器
    if (acquireVsCodeApi === undefined) {
        connectionArgs.commandString = 'uv run mcp run ../servers/main.py';
        connectionMethods.current = 'STDIO';

        bridge.addCommandListener('connect', data => {
            const { code, msg } = data;            
            connectionResult.success = (code === 200);
            connectionResult.logString = msg;
        }, { once: true });

        setTimeout(() => {
			// 初始化 设置
			loadSetting();
			
            doConnect();
        }, 200);
    }
});

</script>

<style>
.main {
	height: calc(100vh - 50px);
	display: flex;
	justify-content: center;
}
</style>
