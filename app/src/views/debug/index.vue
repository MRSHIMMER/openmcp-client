<template>
	<div style="height: 100%;">
		<Welcome v-show="!tabs.activeTab.component"></Welcome>
		
		<!-- 如果存在激活标签页，则根据标签页进行渲染 -->
		<div v-show="tabs.activeTab.component">
			<component
				v-for="(tab, index) of tabs.content"
				v-show="tab === tabs.activeTab"
				:key="index"
				:is="tab.component"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';

import Welcome from './welcome.vue';
import { tabs } from '@/components/main-panel/panel';

defineComponent({ name: 'debug' });
</script>

<style>
</style>