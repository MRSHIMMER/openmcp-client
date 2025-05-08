<template>
<footer class="chat-footer">
    <div class="input-area">
        <div class="input-wrapper">

            <KRichTextarea
                :tabId="tabId"
                v-model="userInput"
                :placeholder="t('enter-message-dot')"
                :customClass="'chat-input'"
                @press-enter="handleSend()"
            />

            <el-button type="primary" @click="isLoading ? handleAbort() : handleSend()" class="send-button">
                <span v-if="!isLoading" class="iconfont icon-send"></span>
                <span v-else class="iconfont icon-stop"></span>
            </el-button>
        </div>
    </div>
</footer>
</template>

<script setup lang="ts">
import { provide, onMounted, onUnmounted, ref, defineEmits, defineProps, PropType, inject, Ref } from 'vue';
import { useI18n } from 'vue-i18n';

import KRichTextarea from './rich-textarea.vue';
import { tabs } from '../../panel';
import { ChatMessage, ChatStorage, MessageState, ToolCall, RichTextItem } from './chat';

import { TaskLoop } from '../core/task-loop';
import { llmManager, llms } from '@/views/setting/llm';
import { ElMessage } from 'element-plus';

const { t } = useI18n();

const props = defineProps({
    tabId: {
        type: Number,
        required: true
    }
});

const emits = defineEmits(['update:scrollToBottom']);

const tab = tabs.content[props.tabId];
const tabStorage = tab.storage as ChatStorage;

// 创建 messages
if (!tabStorage.messages) {
    tabStorage.messages = [] as ChatMessage[];
}

const userInput = ref<string>('');

let loop: TaskLoop | undefined = undefined;

const isLoading = inject('isLoading') as Ref<boolean>;
const autoScroll = inject('autoScroll') as Ref<boolean>;
const streamingContent = inject('streamingContent') as Ref<string>;
const streamingToolCalls = inject('streamingToolCalls') as Ref<ToolCall[]>;
const scrollToBottom = inject('scrollToBottom') as () => Promise<void>;
const updateScrollHeight = inject('updateScrollHeight') as () => void;
const chatContext = inject('chatContext') as any;

chatContext.handleSend = handleSend;

function handleSend(newMessage?: string) {    
    // 将富文本信息转换成纯文本信息
    const userMessage = newMessage || userInput.value;

    if (!userMessage || isLoading.value) {
        return;
    }

    isLoading.value = true;
    autoScroll.value = true;
    
    loop = new TaskLoop(streamingContent, streamingToolCalls);

    loop.registerOnError((error) => {

        ElMessage.error(error.msg);
        
        if (error.state === MessageState.ReceiveChunkError) {
            tabStorage.messages.push({
                role: 'assistant',
                content: error.msg,
                extraInfo: {
                    created: Date.now(),
                    state: error.state,
                    serverName: llms[llmManager.currentModelIndex].id || 'unknown'
                }
            });
        }

        isLoading.value = false;
    });

    loop.registerOnChunk(() => {
        scrollToBottom();
    });

    loop.registerOnDone(() => {
        isLoading.value = false;
        scrollToBottom();
    });

    loop.registerOnEpoch(() => {
        isLoading.value = true;
        scrollToBottom();
    });

    loop.start(tabStorage, userMessage);
    
    userInput.value = '';
}

function handleAbort() {
    if (loop) {
        loop.abort();
        isLoading.value = false;
        ElMessage.info('请求已中止');
    }
}


onMounted(() => {
    updateScrollHeight();
    window.addEventListener('resize', updateScrollHeight);
    scrollToBottom();
});

onUnmounted(() => {
    window.removeEventListener('resize', updateScrollHeight);
});


</script>

<style>
.chat-footer {
    padding: 16px;
    border-top: 1px solid var(--el-border-color);
    flex-shrink: 0;
    position: absolute;
    height: fit-content !important;
    bottom: 0;
    width: 100%;
}

.input-area {
    max-width: 800px;
    margin: 0 auto;
    position: relative;
}

.input-wrapper {
    position: relative;
}

.chat-input {
    padding-right: 80px;
}

.chat-input textarea {
    border-radius: .5em;
}

.send-button {
    position: absolute !important;
    right: 8px !important;
    bottom: 8px !important;
    height: auto;
    padding: 8px 12px;
    font-size: 20px;
    border-radius: 1.2em !important;
}

:deep(.chat-settings) {
    position: absolute;
    left: 0;
    bottom: 0px;
    z-index: 1;
}

.typing-cursor {
    animation: blink 1s infinite;
}

@keyframes blink {
    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }
}
</style>