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
import { useMessageBridge } from './api/message-bridge';

const { postMessage, onMessage, isConnected } = useMessageBridge();

// 监听所有消息
onMessage((message) => {
	console.log('Received:', message.command, message.data);
});

// 发送消息
const sendPing = () => {
	postMessage({
		command: 'ping',
		data: { timestamp: Date.now() }
	});
};


onMounted(() => {
	setDefaultCss();
	document.addEventListener('click', () => {
		Connection.showPanel = false;
	});

	pinkLog('OpenMCP Client 启动');

	sendPing();
})

</script>

<style>
.main {
	height: calc(100vh - 50px);
	display: flex;
	justify-content: center;
}
</style>
