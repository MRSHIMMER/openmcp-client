<template>
	<div style="height: 100%;">
		<Welcome v-if="!tabs.activeTab.component"></Welcome>
        <component v-else :is="tabs.activeTab.component" />
	</div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';

import Welcome from './welcome.vue';
import { tabs } from '@/components/main-panel/panel';

defineComponent({ name: 'TEMPLATE_NAME' });
</script>

<style>
</style>