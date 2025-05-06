<template>
    <h3 class="resource-template">
		<code>resources/templates/list</code>
		<span
			class="iconfont icon-restart"
			@click="reloadResources({ first: false })"
		></span>
	</h3>

	<div class="resource-template-container-scrollbar">
		<el-scrollbar height="500px" v-if="resourcesManager.templates.length > 0">
			<div class="resource-template-container">
				<div
					class="item"
                    :class="{ 'active': tabStorage.currentType === 'template' && tabStorage.currentResourceName === template.name }"
					v-for="template of resourcesManager.templates"
					:key="template.name"
                    @click="handleClick(template)"
				>
					<span>{{ template.name }}</span>
					<span>{{ template.description || '' }}</span>
				</div>
			</div>
		</el-scrollbar>
		<div v-else style="padding: 10px;">
			empty
		</div>
	</div>
</template>

<script setup lang="ts">
import { useMessageBridge } from '@/api/message-bridge';
import { CasualRestAPI, ResourceTemplate, ResourceTemplatesListResponse } from '@/hook/type';
import { onMounted, onUnmounted, defineProps, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { resourcesManager, ResourceStorage } from './resources';
import { tabs } from '../panel';
import { ElMessage } from 'element-plus';

const bridge = useMessageBridge();
const { t } = useI18n();

const props = defineProps({
    tabId: {
        type: Number,
        required: true
    }
});

const tab = tabs.content[props.tabId];
const tabStorage = tab.storage as ResourceStorage;

function reloadResources(option: { first: boolean }) {    
    bridge.postMessage({
        command: 'resources/templates/list'
    });

    if (!option.first) {
        ElMessage({
            message: t('finish-refresh'),
            type: 'success',
			duration: 3000,
			showClose: true,
        });
    }
}

function handleClick(template: ResourceTemplate) {
	tabStorage.currentType = 'template';
    tabStorage.currentResourceName = template.name;
    tabStorage.lastResourceReadResponse = undefined;
}

let commandCancel: (() => void);

onMounted(() => {
    commandCancel = bridge.addCommandListener('resources/templates/list', (data: CasualRestAPI<ResourceTemplatesListResponse>) => {
		resourcesManager.templates = data.msg.resourceTemplates || [];

		if (tabStorage.currentType === 'template') {
			const targetResource = resourcesManager.templates.find(template => template.name === tabStorage.currentResourceName);
			if (targetResource === undefined) {
				tabStorage.currentResourceName = resourcesManager.templates[0]?.name;
				tabStorage.lastResourceReadResponse = undefined;
			}
		}
	}, { once: false });

    reloadResources({ first: true });
});

onUnmounted(() => {
    if (commandCancel){
        commandCancel();
    }
})
</script>

<style>
h3.resource-template {
    display: flex;
    align-items: center;
}

h3.resource-template .iconfont.icon-restart {
    margin-left: 10px;
    cursor: pointer;
}

h3.resource-template .iconfont.icon-restart:hover {
    color: var(--main-color);
}

.resource-template-container-scrollbar {
	background-color: var(--background);
    margin-bottom: 10px;
	border-radius: .5em;
}

.resource-template-container {
	height: fit-content;
	display: flex;
	flex-direction: column;
	padding: 10px;
}

.resource-template-function-container {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.resource-template-function-container button {
    width: 175px;
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

.resource-template-container > .item.active {
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