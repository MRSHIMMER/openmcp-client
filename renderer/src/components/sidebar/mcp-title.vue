<template>
	<div class="mcp-title">
		<div class="simple-logo">
			<span class="iconfont icon-openmcp"></span>
			<span style="font-size: 12px;">openmcp</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';

defineComponent({ name: 'mcp-title' });
</script>

<style>
.mcp-title {
	display: flex;
	align-items: center;
	padding: 5px 10px;
}

.mcp-title>div {
	font-size: 24px;
}

.simple-logo {
	height: 73px;
	display: flex;
	flex-direction: column;
}

.simple-logo .iconfont {
	font-size: 48px;
}
</style>