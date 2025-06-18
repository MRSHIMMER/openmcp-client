<template>
    <el-tooltip :content="props.messages[0].content.text" placement="top" effect="light">
        <span class="chat-prompt-item" contenteditable="false">
            <span class="iconfont icon-chat"></span>
            <span class="real-text">{{ props.messages[0].content.text }}</span>
        </span>
    </el-tooltip>
</template>

<script setup lang="ts">
import type { PromptsGetResponse } from '@/hook/type';
import { defineProps, type PropType } from 'vue';

const props = defineProps({
    messages: {
        type: Array as PropType<PromptsGetResponse['messages']>,
        required: true
    }
});
</script>

<style>
.chat-prompt-item {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-flex;
    border-radius: .3em;
    align-items: center;
    padding: 0 4px;
    background-color: #373839;
    border: 1px solid var(--foreground);
    font-size: 12px;
    margin-left: 3px;
    margin-right: 3px;
}

.chat-prompt-item .iconfont {
    margin-right: 4px;
}
</style>