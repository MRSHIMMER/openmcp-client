<template>
    <div class="message-role">
        Agent
        <span class="message-reminder" v-if="!props.message.toolResult">
            正在使用工具
            <span class="tool-loading iconfont icon-double-loading">
            </span>
        </span>
    </div>
    <div class="message-text tool_calls">
        <div v-if="props.message.content" v-html="markdownToHtml(props.message.content)"></div>

        <div class="tool-calls">
            <div v-for="(call, index) in props.message.tool_calls" :key="index" class="tool-call-item">
                <div class="tool-call-header">
                    <span class="tool-type">{{ 'tool' }}</span>
                    <span class="tool-name">{{ call.function.name }}</span>
                    <el-button size="small" @click="createTest(call)">
                        <span class="iconfont icon-send"></span>
                    </el-button>
                </div>
                <div class="tool-arguments">
                    <div class="inner">
                        <div v-html="jsonResultToHtml(call.function.arguments)"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 工具调用结果 -->
        <div v-if="props.message.toolResult">
            <div class="tool-call-header">
                <span class="tool-name">{{ "响应" }}</span>
                <span style="width: 200px;" class="tools-dialog-container">
                    <el-switch v-model="props.message.showJson!.value" inline-prompt active-text="JSON" inactive-text="Text"
                        style="margin-left: 10px; width: 200px;"
                        :inactive-action-style="'backgroundColor: var(--sidebar)'" />
                </span>
            </div>
            <div class="tool-result" v-if="isValidJSON(props.message.toolResult)">
                <div v-if="props.message.showJson!.value" class="tool-result-content">
                    <div class="inner">
                        <div v-html="jsonResultToHtml(props.message.toolResult)"></div>
                    </div>
                </div>
                <span v-else>
                    <div v-for="(item, index) in JSON.parse(props.message.toolResult)" :key="index">
                        <el-scrollbar width="100%">
                            <div v-if="item.type === 'text'" class="tool-text">{{ item.text }}</div>
                            <div v-else class="tool-other">{{ JSON.stringify(item) }}</div>
                        </el-scrollbar>
                    </div>
                </span>
            </div>
        </div>
    </div>
    <MessageMeta :message="message" />
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

import MessageMeta from './message-meta.vue';
import { markdownToHtml } from '../markdown';
import { createTest } from '@/views/setting/llm';

const props = defineProps({
    message: {
        type: Object,
        required: true
    }
});

const jsonResultToHtml = (jsonString: string) => {
    const formattedJson = JSON.stringify(JSON.parse(jsonString), null, 2);
    const html = markdownToHtml('```json\n' + formattedJson + '\n```');
    return html;
};

const isValidJSON = (str: string) => {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
};

</script>

<style>

.tool-calls {
    margin-top: 10px;
}

.tool-call-item {
    margin-bottom: 10px;
}

.tool-call-header {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
}

.tool-name {
    font-weight: bold;
    color: var(--el-color-primary);
    margin-right: 8px;
    margin-bottom: 0;
    display: flex;
    align-items: center;
    height: 26px;
}

.tool-type {
    font-size: 0.8em;
    color: var(--el-text-color-secondary);
    background-color: var(--el-fill-color-light);
    padding: 2px 6px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    margin-right: 10px;
}

.tool-arguments {
    margin: 0;
    padding: 8px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
}

.tool-result {
    padding: 8px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
}

.tool-text {
    white-space: pre-wrap;
    line-height: 1.6;
}

.tool-other {
    font-family: monospace;
    font-size: 0.9em;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
}


</style>