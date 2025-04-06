<template>
    <div class="chat-container" ref="chatContainerRef">
        <el-scrollbar :height="'90%'">
            <div class="message-list">
                <div v-for="(message, index) in messages" :key="index" :class="['message-item', message.role]">
                    <div class="message-avatar" v-if="message.role === 'assistant'">
                        <span class="iconfont icon-chat"></span>
                    </div>
                    <div class="message-content">
                        <div class="message-role">{{ message.role === 'user' ? '' : 'Agent' }}</div>
                        <div class="message-text">
                            <span>{{ message.content }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="isLoading" class="message-item assistant">
                    <div class="message-avatar">
                        <el-avatar :icon="Comment" />
                    </div>
                    <div class="message-content">
                        <div class="message-role">AI</div>
                        <div class="message-text">{{ streamingContent }}<span class="typing-cursor">|</span></div>
                    </div>
                </div>
            </div>
        </el-scrollbar>

        <el-footer class="chat-footer" ref="footerRef">
            <div class="input-area">

                <Setting :tabId="tabId" />

                <div class="input-wrapper">
                    <el-input v-model="userInput" type="textarea" :rows="inputHeightLines" :maxlength="2000"
                        placeholder="输入消息..." :disabled="isLoading" @keydown.enter="handleKeydown" resize="none"
                        class="chat-input" />
                    <el-button type="primary" :loading="isLoading" @click="handleSend" class="send-button"
                        :disabled="!userInput.trim()">
                        <span class="iconfont icon-send"></span>
                    </el-button>
                </div>
            </div>
        </el-footer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineComponent, defineProps, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { User, Comment } from '@element-plus/icons-vue';
import { useMessageBridge } from "@/api/message-bridge";
import { ElMessage } from 'element-plus';
import { llmManager, llms } from '@/views/setting/llm';
import { tabs } from '../panel';
import { ChatMessage, ChatStorage } from './chat';

import Setting from './setting.vue';

defineComponent({ name: 'chat' });

const { t } = useI18n();

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
const messages = ref<ChatMessage[]>([
    {
        role: 'assistant',
        content: '你好！我是AI助手，有什么可以帮您的吗？'
    },
    {
        role: 'user',
        content: '你好，能帮我写一封求职信吗？'
    },
    {
        role: 'assistant',
        content: '当然可以。请问您应聘的是什么职位？需要包含哪些特别的信息吗？'
    },
    {
        role: 'user',
        content: '我想应聘前端开发工程师，有3年Vue和React经验'
    },
    {
        role: 'assistant',
        content: '好的，我已根据您的要求写了一封求职信模板：\n\n尊敬的招聘经理，\n\n您好！我在贵公司官网上看到前端开发工程师的招聘信息...'
    },
    {
        role: 'user',
        content: '谢谢！能再帮我优化一下简历中的项目描述部分吗？'
    },
    {
        role: 'assistant',
        content: '当然可以。建议采用STAR法则(Situation-Task-Action-Result)来描述项目经验，这样更能突出您的贡献和价值。'
    },
    {
        role: 'user',
        content: '什么是STAR法则？能举个例子吗？'
    },
    {
        role: 'assistant',
        content: 'STAR法则是一种结构化表达方法：\n\n情境(Situation)：项目背景\n任务(Task)：你的职责\n行动(Action)：采取的措施\n结果(Result)：取得的成果\n\n例如：开发了基于Vue3的管理系统，优化了页面加载速度30%...'
    },
    {
        role: 'user',
        content: '明白了，这样写确实更专业！'
    }
]);
const isLoading = ref(false);
const streamingContent = ref('');
const chatContainerRef = ref<HTMLElement>();
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

const handleSend = () => {
    if (!userInput.value.trim() || isLoading.value) return;

    const userMessage = userInput.value.trim();
    messages.value.push({ role: 'user', content: userMessage });

    const chatData = {
        messages: [
            ...messages.value.filter(msg => msg.role === 'user').map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: 'assistant', content: streamingContent.value }
        ]
    };

    isLoading.value = true;
    streamingContent.value = '';

    bridge.postMessage({
        command: 'llm/chat/completions',
        data: chatData
    });

    userInput.value = '';
};

const handleError = (errorMsg: string) => {
    ElMessage.error(errorMsg);
    messages.value.push({
        role: 'assistant',
        content: `错误: ${errorMsg}`
    });
    streamingContent.value = '';
    isLoading.value = false;
};

onMounted(() => {
    updateScrollHeight();
    window.addEventListener('resize', updateScrollHeight);

    bridge.addCommandListener('llm/chat/completions/chunk', data => {
        if (data.code !== 200) {
            handleError(data.msg || '请求模型服务时发生错误');
            return;
        }
        const { content } = data.msg;
        if (content) {
            streamingContent.value += content;
        }
    }, { once: false });

    bridge.addCommandListener('llm/chat/completions/done', data => {
        if (data.code !== 200) {
            handleError(data.msg || '模型服务处理完成但返回错误');
            return;
        }
        if (streamingContent.value) {
            messages.value.push({
                role: 'assistant',
                content: streamingContent.value
            });
            streamingContent.value = '';
        }
        isLoading.value = false;
    }, { once: false });
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
    white-space: pre-wrap;
}

.user .message-text {
    margin-top: 10px;
    margin-bottom: 10px;
}

.user .message-text > span {
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
    position: absolute;
    right: 8px;
    bottom: 8px;
    height: auto;
    padding: 8px 12px;
    font-size: 20px;
    border-radius: .5em;
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