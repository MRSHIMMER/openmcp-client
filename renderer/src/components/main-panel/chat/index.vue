<template>
    <div class="chat-container" :ref="el => chatContainerRef = el">
        <el-scrollbar ref="scrollbarRef" :height="'90%'" @scroll="handleScroll">
            <div class="message-list" :ref="el => messageListRef = el">
                <div v-for="(message, index) in tabStorage.messages" :key="index"
                    :class="['message-item', message.role]">
                    <div class="message-avatar" v-if="message.role === 'assistant'">
                        <span class="iconfont icon-chat"></span>
                    </div>

                    <!-- 用户输入的部分，不需要渲染成 markdown -->
                    <div class="message-content" v-if="message.role === 'user'">
                        <div class="message-role"></div>
                        <div class="message-text">
                            <span>{{ message.content }}</span>
                        </div>
                    </div>

                    <!-- 助手返回的部分 -->
                    <div class="message-content" v-else-if="message.role === 'assistant'">
                        <div class="message-role">Agent</div>
                        <div class="message-text">
                            <div v-html="markdownToHtml(message.content)"></div>
                            <span class="iconfont icon-copy" @click="handleCopy(message.content)"></span>
                        </div>
                    </div>

                    <!-- 待定 -->
                    <div class="message-content" v-else>
                        <div class="message-role">Tool</div>
                        <div class="message-text">
                            <span>Tool</span>
                        </div>
                    </div>

                </div>

                <!-- 正在加载的部分实时解析 markdown -->
                <div v-if="isLoading" class="message-item assistant">
                    <div class="message-avatar">
                        <span class="iconfont icon-chat"></span>
                    </div>
                    <div class="message-content">
                        <div class="message-role">Agent</div>
                        <div class="message-text">
                            <span v-html="waitingMarkdownToHtml(streamingContent)"></span>
                        </div>
                    </div>
                </div>
            </div>
        </el-scrollbar>

        <el-footer class="chat-footer" ref="footerRef">
            <div class="input-area">
                <div class="input-wrapper">
                    <Setting :tabId="tabId" />

                    <el-input v-model="userInput" type="textarea" :rows="inputHeightLines" :maxlength="2000"
                        placeholder="输入消息..." @keydown.enter="handleKeydown" resize="none" class="chat-input" />

                    <el-button type="primary" @click="isLoading ? handleAbort() : handleSend()" class="send-button">
                        <span v-if="!isLoading" class="iconfont icon-send"></span>
                        <span v-else class="iconfont icon-stop"></span>
                    </el-button>
                </div>
            </div>
        </el-footer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineComponent, defineProps, onUnmounted, computed, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMessageBridge } from "@/api/message-bridge";
import { ElMessage, ScrollbarInstance } from 'element-plus';
import { tabs } from '../panel';
import { ChatMessage, ChatStorage } from './chat';

import Setting from './setting.vue';
import { llmManager, llms } from '@/views/setting/llm';
// 引入 markdown.ts 中的函数
import { markdownToHtml, copyToClipboard } from './markdown';

defineComponent({ name: 'chat' });

const { t } = useI18n();

function waitingMarkdownToHtml(content: string) {
    if (content) {
        return markdownToHtml(content);
    }
    return '<span class="typing-cursor">|</span>';
}

const props = defineProps({
    tabId: {
        type: Number,
        required: true
    }
});

const tab = tabs.content[props.tabId];
const tabStorage = tab.storage as ChatStorage;

const bridge = useMessageBridge();
const userInput = ref('');
const inputHeightLines = computed(() => {
    const currentLines = userInput.value.split('\n').length;
    return Math.min(12, Math.max(5, currentLines));
});

// 创建 messages
if (!tabStorage.messages) {
    tabStorage.messages = [] as ChatMessage[];
}

const isLoading = ref(false);
const streamingContent = ref('');
const chatContainerRef = ref<any>(null);
const messageListRef = ref<any>(null);

const footerRef = ref<HTMLElement>();
const scrollHeight = ref('500px');

const updateScrollHeight = () => {
    if (chatContainerRef.value && footerRef.value) {
        const containerHeight = chatContainerRef.value.clientHeight;
        const footerHeight = footerRef.value.clientHeight;
        scrollHeight.value = `${containerHeight - footerHeight}px`;
    }
};

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
    }
    // Shift+Enter 允许自然换行
};

const handleCopy = async (text: string) => {
    try {
        await copyToClipboard(text);
        ElMessage.success('复制成功');
    } catch (error) {
        ElMessage.error('复制失败: ' + error);
    }
};

const autoScroll = ref(true);
const scrollbarRef = ref<ScrollbarInstance>();

// 修改后的 handleScroll 方法
const handleScroll = ({ scrollTop, scrollHeight, clientHeight }: {
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number
}) => {
    // 如果用户滚动到接近底部(留10px缓冲)，则恢复自动滚动
    autoScroll.value = scrollTop + clientHeight >= scrollHeight - 10;
};

// 修改 scrollToBottom 方法
const scrollToBottom = async () => {
    if (!scrollbarRef.value || !messageListRef.value) return;

    await nextTick(); // 等待 DOM 更新

    try {
        const container = scrollbarRef.value.wrapRef;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        console.error('Scroll to bottom failed:', error);
    }
};

// 添加对 streamingContent 的监听
watch(streamingContent, () => {
    if (autoScroll.value) {
        scrollToBottom();
    }
}, { deep: true });


const handleSend = () => {
    if (!userInput.value.trim() || isLoading.value) return;

    autoScroll.value = true; // 发送新消息时恢复自动滚动
    const userMessage = userInput.value.trim();
    tabStorage.messages.push({ role: 'user', content: userMessage });

    // 后端接受属性 baseURL, apiKey, model, messages, temperature
    const baseURL = llms[llmManager.currentModelIndex].baseUrl;
    const apiKey = llms[llmManager.currentModelIndex].userToken;
    const model = llms[llmManager.currentModelIndex].userModel;
    const temperature = tabStorage.settings.temperature;

    const userMessages = [];
    if (tabStorage.settings.systemPrompt) {
        userMessages.push({
            role: 'system',
            content: tabStorage.settings.systemPrompt
        });
    }
    // 如果超出了 tabStorage.settings.contextLength, 则删除最早的消息
    const loadMessages = tabStorage.messages.slice(-tabStorage.settings.contextLength);
    userMessages.push(...loadMessages);

    const chatData = {
        baseURL,
        apiKey,
        model,
        temperature,
        messages: userMessages,
    };

    isLoading.value = true;
    streamingContent.value = '';

    const chunkHandler = bridge.addCommandListener('llm/chat/completions/chunk', data => {
        if (data.code !== 200) {
            handleError(data.msg || '请求模型服务时发生错误');
            return;
        }
        const { content } = data.msg;
        if (content) {
            streamingContent.value += content;
            scrollToBottom(); // 内容更新时滚动到底部
        }
    }, { once: false });

    bridge.addCommandListener('llm/chat/completions/done', data => {
        if (data.code !== 200) {
            handleError(data.msg || '模型服务处理完成但返回错误');
            return;
        }
        if (streamingContent.value) {
            // 加入消息列表

            tabStorage.messages.push({
                role: 'assistant',
                content: streamingContent.value
            });
            streamingContent.value = '';
        }
        isLoading.value = false;
        chunkHandler();
    }, { once: true });

    bridge.postMessage({
        command: 'llm/chat/completions',
        data: chatData
    });

    userInput.value = '';
};

const handleAbort = () => {
    bridge.postMessage({
        command: 'llm/chat/completions/abort', // 假设后端有对应的中止命令
        data: {}
    });
    isLoading.value = false;
    streamingContent.value = '';
    ElMessage.info('请求已中止');
};

const handleError = (errorMsg: string) => {
    ElMessage.error(errorMsg);
    tabStorage.messages.push({
        role: 'assistant',
        content: `错误: ${errorMsg}`
    });
    streamingContent.value = '';
    isLoading.value = false;
};

onMounted(() => {
    updateScrollHeight();
    window.addEventListener('resize', updateScrollHeight);
    scrollToBottom();
});

onUnmounted(() => {
    window.removeEventListener('resize', updateScrollHeight);
});
</script>

<style scoped>
.chat-container {
    height: 100%;
    display: flex;
    position: relative;
    flex-direction: column;
}

.message-list {
    max-width: 800px;
    margin: 0 auto;
    padding: 16px;
    padding-bottom: 100px;
}

.message-item {
    display: flex;
    margin-bottom: 16px;
}

.message-avatar {
    margin-right: 12px;
}

.message-content {
    flex: 1;
    width: 100%;
}

.message-role {
    font-weight: bold;
    margin-bottom: 4px;
    color: var(--el-text-color-regular);
}

.message-text {
    line-height: 1.6;
}

.user .message-text {
    margin-top: 10px;
    margin-bottom: 10px;
}

.user .message-text>span {
    border-radius: .9em;
    background-color: var(--main-light-color);
    padding: 10px 15px;
}

.user {
    flex-direction: row-reverse;
    text-align: right;
}

.user .message-avatar {
    margin-right: 0;
    margin-left: 12px;
}

.user .message-content {
    align-items: flex-end;
}

.assistant {
    text-align: left;
    margin-top: 30px;
}

.chat-footer {
    padding: 16px;
    border-top: 1px solid var(--el-border-color);
    flex-shrink: 0;
    position: absolute;
    height: fit-content;
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
    border-radius: .5em;
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

<style scoped>
/* 原有样式保持不变 */

/* 新增样式来减小行距 */
.message-text p,
.message-text h3,
.message-text ol,
.message-text ul {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
    line-height: 1.4;
    /* 可以根据需要调整行高 */
}

.message-text ol li,
.message-text ul li {
    margin-top: 0.2em;
    margin-bottom: 0.2em;
}
</style>