<template>
	<div class="main-panel-container">
		<div class="tabs-container">
			<span
				class="tab"
				v-for="(_, index) of tabs.content"
				:key="index"
			></span>
			<span class="add-button"
				@click="addNewTab"
			></span>
		</div>
		<div class="main-panel">
			<router-view />
		</div>
	</div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import { addNewTab, tabs } from './panel';

defineComponent({ name: 'main-panel' });
</script>

<style>

.main-panel-container {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	width: 100%;
	height: 100%;
	margin-left: 20px;
}

.main-panel {
	background-color: var(--sidebar);
	border-radius: 1.2em;
	width: 100%;
	height: 95%;
}

.tabs-container {
	height: 78px;
	width: 90%;
	background-color: var(--background);
	display: flex;
	align-items: center;

}

.tabs-container .tab {
	margin: 5px;
}

.tabs-container .add-button {
	height: 20px;
	width: 20px;
	border-radius: .5em;
}

</style>