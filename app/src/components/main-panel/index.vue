<template>
	<div class="main-panel-container">
		<div class="tabs-container">
			<span
				class="tab"
				v-for="(tab, index) of tabs.content"
				:key="index"
			>
				<span :class="`iconfont ${tab.icon}`"></span>
				<span>{{ tab.name }}</span>
			</span>
			<span
				class="add-button iconfont icon-add"
				@click="addNewTab"
			>
			</span>
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
	justify-content: center;
	flex-direction: column;
	width: 100%;
	min-width: 800px;
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
	border-radius: .5em;
	background-color: var(--sidebar);
	padding: 10px;
}

.tabs-container .tab .iconfont {
	margin-right: 10px;
}

.tabs-container .add-button {
	height: 20px;
	width: 20px;
	border-radius: .5em;
}

.tabs-container .add-button {
	cursor: pointer;
	font-size: 20px;
	margin-left: 5px;
	border-radius: .5em;
	height: 35px;
	width: 35px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: var(--animation-3s);
}

.tabs-container .add-button:hover {
	color: var(--main-color);
	background-color: var(--sidebar);
	transition: var(--animation-3s);
}

</style>