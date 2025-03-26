<template>
	<div class="main-panel-container">
		<div class="tabs-container">
			<span
				class="tab"
				v-for="(tab, index) of tabs.content"
				:key="index"
				:class="{ 'active-tab': tabs.activeIndex === index }"
				@click="setActiveTab(index)"
			>
				<span :class="`iconfont ${tab.icon}`"></span>
				<span>{{ tab.name }}</span>
				<span 
					class="iconfont icon-close"
					@click.stop="closeTab(index)"
				></span>
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
import { addNewTab, tabs, setActiveTab, closeTab } from './panel';

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
    user-select: none;
	padding: 0 10px;
}

.tabs-container .tab {
	margin: 5px;
	border-radius: .5em;
	background-color: var(--sidebar);
	padding: 10px;
	display: flex;
	align-items: center;
	cursor: pointer;
	transition: var(--animation-3s);
	position: relative;
}

.tabs-container .tab:hover {
	background-color: var(--sidebar-hover);
}

.tabs-container .tab.active-tab {
	background-color: var(--main-color);
	color: white;
}

.tabs-container .tab .iconfont {
	margin-right: 10px;
}

.tabs-container .icon-close {
    margin-left: 10px;
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

.close-icon {
	margin-left: 8px;
	font-size: 14px;
	padding: 2px;
	border-radius: 50%;
}

.close-icon:hover {
	background-color: rgba(255, 255, 255, 0.2);
}
</style>