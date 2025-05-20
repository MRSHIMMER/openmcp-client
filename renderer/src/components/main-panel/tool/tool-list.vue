<template>

    <el-collapse :expand-icon-position="'left'" v-model="activeNames">
        <el-collapse-item v-for="(client, index) in mcpClientAdapter.clients" :name="index" :class="[]">

            <!-- header -->
            <template #title>
                <h3 class="resource-template">
                    <code>tools/list</code>
                    <span class="iconfont icon-restart" @click="reloadTools({ first: false })"></span>
                </h3>
            </template>

            <!-- body -->

            <div class="tool-list-container-scrollbar">
                <el-scrollbar height="500px">
                    <div class="tool-list-container">
                        <div class="item" :class="{ 'active': tabStorage.currentToolName === tool.name }"
                            v-for="tool of client.tools?.values()" :key="tool.name" @click="handleClick(tool)">
                            <span>{{ tool.name }}</span>
                            <span>{{ tool.description || '' }}</span>
                        </div>
                    </div>
                </el-scrollbar>
            </div>
        </el-collapse-item>
    </el-collapse>
</template>

<script setup lang="ts">
import { useMessageBridge } from '@/api/message-bridge';
import type { CasualRestAPI, ToolsListResponse } from '@/hook/type';
import { onMounted, onUnmounted, defineProps, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ToolStorage } from './tools';
import { tabs } from '../panel';
import { ElMessage } from 'element-plus';
import { mcpClientAdapter } from '@/views/connect/core';

const bridge = useMessageBridge();
const { t } = useI18n();

const props = defineProps({
    tabId: {
        type: Number,
        required: true
    }
});

const tab = tabs.content[props.tabId];
const tabStorage = tab.storage as ToolStorage;

const activeNames = ref<any[]>([0]);

function reloadTools(option: { first: boolean }) {
    bridge.postMessage({
        command: 'tools/list'
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

function handleClick(tool: { name: string }) {
    tabStorage.currentToolName = tool.name;
    tabStorage.lastToolCallResponse = undefined;
}

onMounted(async () => {
    for (const client of mcpClientAdapter.clients) {
        await client.getTools();
    }
});

</script>

<style>
.tool-list-container-scrollbar {
    background-color: var(--background);
    margin-bottom: 10px;
    border-radius: .5em;
}

.tool-list-container {
    height: fit-content;
    display: flex;
    flex-direction: column;
    padding: 10px;
}

.tool-list-function-container {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tool-list-function-container button {
    width: 175px;
}

.tool-list-container>.item {
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

.tool-list-container>.item:hover {
    background-color: var(--main-light-color);
    transition: var(--animation-3s);
}

.tool-list-container>.item.active {
    background-color: var(--main-light-color);
    transition: var(--animation-3s);
}

.tool-list-container>.item>span:first-child {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tool-list-container>.item>span:last-child {
    opacity: 0.6;
    font-size: 12.5px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>