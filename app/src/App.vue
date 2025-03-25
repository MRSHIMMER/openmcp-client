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


onMounted(() => {
	document.addEventListener('click', () => {
		Connection.showPanel = false;
	});
})

</script>

<style>
.main {
	height: calc(100vh - 50px);
	display: flex;
	justify-content: center;
}
</style>
