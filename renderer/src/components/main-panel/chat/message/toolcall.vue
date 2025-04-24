<template>
    <div class="message-role">
        Agent
        <span class="message-reminder" v-if="!props.message.toolResult">
            正在使用工具
            <span class="tool-loading iconfont icon-double-loading">
            </span>
        </span>
    </div>
    <div class="message-text tool_calls" :class="{ 'fail': props.message.toolResult && props.message.extraInfo.state != MessageState.Success }">
        <div v-if="props.message.content" v-html="markdownToHtml(props.message.content)"></div>

        <el-collapse v-model="activeNames" v-if="props.message.tool_calls">
            <el-collapse-item name="tool">

                <template #title>
                    <div class="tool-calls">
                        <div class="tool-call-header">
                            <span class="tool-type">{{ 'tool use' }}</span>
                            <span class="tool-name">{{ props.message.tool_calls[0].function.name }}</span>
                            <el-button size="small" @click="createTest(props.message.tool_calls[0])">
                                <span class="iconfont icon-send"></span>
                            </el-button>
                        </div>
                    </div>
                </template>

                <div>
                    <div class="tool-arguments">
                        <div class="inner">
                            <div v-html="jsonResultToHtml(props.message.tool_calls[0].function.arguments)"></div>
                        </div>
                    </div>

                    <!-- 工具调用结果 -->
                    <div v-if="props.message.toolResult">
                        <div class="tool-call-header">
                            <span class="tool-name" :class="{ 'error': !isValidJson }">
                                {{ isValidJson ? '响应': '错误' }}
                            </span>
                            <span style="width: 200px;" class="tools-dialog-container" v-if="isValidJson">
                                <el-switch v-model="props.message.showJson!.value" inline-prompt active-text="JSON"
                                    inactive-text="Text" style="margin-left: 10px; width: 200px;"
                                    :inactive-action-style="'backgroundColor: var(--sidebar)'" />
                            </span>
                        </div>
                        <div class="tool-result" v-if="isValidJson">
                            <div v-if="props.message.showJson!.value" class="tool-result-content">
                                <div class="inner">
                                    <div v-html="jsonResultToHtml(props.message.toolResult)"></div>
                                </div>
                            </div>
                            <span v-else>
                                <div v-for="(item, index) in JSON.parse(props.message.toolResult)" :key="index"
                                    class="response-item"
                                >
                                    <el-scrollbar width="100%">
                                        <div v-if="item.type === 'text'" class="tool-text">
                                            {{ item.text }}
                                        </div>
                                        
                                        <div v-else-if="item.type === 'image'" class="tool-image">
                                            <img :src="`data:${item.mimeType};base64,${item.data}`" style="max-width: 70%;" />
                                        </div>

                                        <div v-else class="tool-other">{{ JSON.stringify(item) }}</div>
                                    </el-scrollbar>
                                </div>
                            </span>
                        </div>
                        <div v-else class="tool-result" :class="{ 'error': !isValidJson }">
                            <div class="tool-result-content">
                                <div class="inner">
                                    {{ props.message.toolResult }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-collapse-item>
        </el-collapse>
    </div>
    <MessageMeta :message="message" />
</template>

<script setup lang="ts">
import { defineProps, ref, watch, PropType, computed } from 'vue';

import MessageMeta from './message-meta.vue';
import { markdownToHtml } from '../markdown';
import { createTest } from '@/views/setting/llm';
import { IRenderMessage, MessageState } from '../chat';

const props = defineProps({
    message: {
        type: Object as PropType<IRenderMessage>,
        required: true
    }
});


const activeNames = ref<string[]>(props.message.toolResult ? [''] : ['tool']);

watch(
    () => props.message.toolResult,
    (value, oldValue) => {
        if (value) {
            setTimeout(() => {
                activeNames.value = [''];
            }, 1000);
        }
    }
);

const jsonResultToHtml = (jsonString: string) => {
    const formattedJson = JSON.stringify(JSON.parse(jsonString), null, 2);
    const html = markdownToHtml('```json\n' + formattedJson + '\n```');
    return html;
};


const isValidJson = computed(() => {
    try {
        JSON.parse(props.message.toolResult || '');
        return true;
    } catch {
        return false;
    }
});

</script>

<style>
.message-text.tool_calls {
    border-left: 3px solid var(--main-color);
    padding-left: 10px;
}

.message-text.tool_calls.fail {
    border-left: 3px solid var(--el-color-error);
}

.tool-calls {
    margin-top: 10px;
}

.tool-call-item {
    margin-bottom: 10px;
}

.tool-call-header {
    display: flex;
    align-items: center;
    margin-top: 10px;
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

.tool-name.error {
    color: var(--el-color-error);
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
    height: 22px;
}

.response-item {
    margin-bottom: 10px;
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

.tool-result.error {
	background-color: rgba(245, 108, 108, 0.5);
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