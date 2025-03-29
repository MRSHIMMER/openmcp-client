<template>
	<div class="resource-template-container-scrollbar">
		<el-scrollbar height="500px">
			<div class="resource-template-container">
				<div
					class="item"
					v-for="template of resourcesManager.templates"
					:key="template.name"
				>
					<span>{{ template.name }}</span>
					<span>{{ template.description || '' }}</span>
				</div>
			</div>
		</el-scrollbar>
	</div>
</template>

<script setup lang="ts">
import { useMessageBridge } from '@/api/message-bridge';
import { CasualRestAPI, ResourceTemplatesListResponse } from '@/hook/type';
import { onMounted, onUnmounted } from 'vue';
import { resourcesManager } from './resources';

const bridge = useMessageBridge();
let cancelListener: undefined | (() => void) = undefined;

function reloadResources() {    
    bridge.postMessage({
        command: 'resources/templates/list'
    });
}

onMounted(() => {    
    cancelListener = bridge.addCommandListener('resources/templates/list', (data: CasualRestAPI<ResourceTemplatesListResponse>) => {
		resourcesManager.templates = data.msg.resourceTemplates;
	});
    reloadResources();
});

onUnmounted(() => {
	if (cancelListener) {
		cancelListener();
	}
});

</script>

<style>
.resource-template-container-scrollbar {
	background-color: var(--background);
	border-radius: .5em;
}

.resource-template-container {
	height: fit-content;
	display: flex;
	flex-direction: column;
	padding: 10px;
}

.resource-template-container > .item {
	margin: 3px;
	padding: 5px 10px;
	border-radius: .3em;
	user-select: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: var(--animation-3s);
}

.resource-template-container > .item:hover {
	background-color: var(--main-light-color);
	transition: var(--animation-3s);
}

.resource-template-container > .item > span:first-child {
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.resource-template-container > .item > span:last-child {
	opacity: 0.6;
	font-size: 12.5px;
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

</style>