<template>
	<div class="connection-container">
		<div class="server-list">
			<div v-for="(client, index) in mcpClientAdapter.clients" :key="index" class="server-item"
				:class="{ 'active': mcpClientAdapter.currentClientIndex === index }" @click="selectServer(index)">
				<span class="connect-status">
					<span v-if="client.connectionResult.success">
						<span class="iconfont icon-connect"></span>
						<span class="iconfont icon-dui"></span>
					</span>
					<span v-else>
						<span class="iconfont icon-connect"></span>
						<span class="server-name"> Unconnected </span>
					</span>
				</span>
			</div>
			<div class="add-server" @click="addServer">
				<span class="iconfont icon-add"></span>
			</div>
		</div>
		<div class="panel-container">
			<ConnectionPanel v-if="mcpClientAdapter.clients.length > 0" :index="mcpClientAdapter.currentClientIndex" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import ConnectionPanel from './connection-panel.vue';
import { McpClient, mcpClientAdapter } from './core';
import { ElMessage } from 'element-plus';

defineComponent({ name: 'connection' });

function selectServer(index: number) {
	mcpClientAdapter.currentClientIndex = index;
}

function addServer() {
	ElMessage.info('Add server is not implemented yet');
	mcpClientAdapter.clients.push(new McpClient());
	mcpClientAdapter.currentClientIndex = mcpClientAdapter.clients.length - 1;
}
</script>

<style>
.connection-container {
	display: flex;
	height: 100%;
}

.server-list {
	width: 150px;
	border-right: 1px solid var(--border-color);
	padding: 10px;
}

.server-name {
	font-size: 15px;
}

.server-item {
	padding: 10px;
	margin-bottom: 5px;
	cursor: pointer;
	border-radius: 4px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.server-item.active {
	background-color: var(--main-color);
	color: white;
}

.server-status {
	font-size: 12px;
}

.server-status.connected {
	color: green;
}

.server-status.disconnected {
	color: red;
}

.add-server {
	padding: 10px;
	text-align: center;
	cursor: pointer;
	border-radius: 4px;
	border: 1px dashed var(--border-color);
}

.add-server:hover {
	background-color: var(--background);
}

.panel-container {
	flex: 1;
	padding: 20px;
}
</style>