<template>
    <div class="chat-container" :ref="el => chatContainerRef = el">
        <!-- 并行模式切换工具栏 -->
        <div class="parallel-toolbar">
            <el-button @click="toggleParallelMode" size="small">
                {{ isParallelMode ? t('switch-to-single-chat') : t('switch-to-parallel-chat') }}
            </el-button>
            <div v-if="isParallelMode" class="model-selector">
                <el-select 
                    v-model="selectedModels" 
                    multiple 
                    filterable
                    :placeholder="t('choose-model-to-compare')"
                    @change="initParallelChats"
                    :filter-method="filterModels"
                    :no-match-text="t('no-match-model')"
                >
                    <el-option
                        v-for="model in filteredModels"
                        :key="model.id"
                        :label="model.name"
                        :value="model.id"
                    />
                </el-select>
                <span v-if="parallelChats.length > 0" style="margin-left: 10px; font-size: 12px; width: 130px;">
                    已选择 {{ parallelChats.length }} 个模型
                </span>
            </div>
        </div>

        <!-- 单聊天模式 -->
        <template v-if="!isParallelMode">
            <el-scrollbar ref="scrollbarRef" :height="'90%'" @scroll="handleScroll"
                v-if="renderMessages.length > 0 || isLoading">
                <div class="message-list" :ref="el => messageListRef = el">
                    <div v-for="(message, index) in renderMessages" :key="index"
                        :class="['message-item', message.role.split('/')[0], message.role.split('/')[1]]">
                        <div class="message-avatar" v-if="message.role === 'assistant/content'">
                            <span class="iconfont icon-robot"></span>
                        </div>
                        <div class="message-avatar" v-else-if="message.role === 'assistant/tool_calls'">
                        </div>

                        <!-- 用户输入的部分 -->
                        <div class="message-content" v-if="message.role === 'user'">
                            <Message.User :message="message" :tab-id="props.tabId" />
                        </div>

                        <!-- 助手返回的内容部分 -->
                        <div class="message-content" v-else-if="message.role === 'assistant/content'">
                            <Message.Assistant :message="message" :tab-id="props.tabId" />
                        </div>

                        <!-- 助手调用的工具部分 -->
                        <div class="message-content" v-else-if="message.role === 'assistant/tool_calls'">
                            <Message.Toolcall :message="message" :tab-id="props.tabId"
                                @update:tool-result="(value, toolIndex, index) => message.toolResults[toolIndex][index] = value" />
                        </div>
                    </div>

                    <!-- 正在加载的部分实时解析 markdown -->
                    <div v-if="isLoading" class="message-item assistant">
                        <Message.StreamingBox :streaming-content="streamingContent" :tab-id="props.tabId" />
                    </div>
                </div>
            </el-scrollbar>
            <div v-else class="chat-openmcp-icon">
                <div>
                    <span>{{ t('press-and-run') }}
                        <span style="padding: 5px 15px; border-radius: .5em; background-color: var(--background);">
                            <span class="iconfont icon-send"></span>
                        </span>
                    </span>
                </div>
            </div>
        </template>

        <!-- 并行聊天模式 -->
        <template v-else>
            <div class="parallel-chat-container">
                <div 
                    v-for="(chat, chatIndex) in parallelChats" 
                    :key="chat.modelId"
                    class="parallel-chat-instance"
                    :style="{ width: `${100 / parallelChats.length}%` }"
                >
                    <div class="chat-header">
                        <span class="model-name">{{ getModelName(chat.modelId) }}</span>
                        <div class="chat-actions">
                              <el-popconfirm title="确定要清空此对话的上下文吗？"
                                @confirm="clearChatHistory(chatIndex)"
                              >
                                <template #reference>
                                    <el-button 
                                        size="small" 
                                        type="warning"
                                        title="清空上下文"
                                    >
                                        {{ t('clear') }}
                                    </el-button>
                                </template>
                            </el-popconfirm>

                            <el-button 
                                @click="removeParallelChat(chatIndex)" 
                                size="small" 
                                type="danger"
                                title="移除此对话"
                            >
                                <span class="iconfont icon-delete"></span>
                            </el-button>
                        </div>
                    </div>
                    <el-scrollbar :height="'85%'" 
                        v-if="chat.renderMessages.length > 0 || chat.isLoading">
                        <div class="message-list">
                            <div v-for="(message, index) in chat.renderMessages" :key="index"
                                :class="['message-item', message.role.split('/')[0], message.role.split('/')[1]]">
                                <div class="message-avatar" v-if="message.role === 'assistant/content'">
                                    <span class="iconfont icon-robot"></span>
                                </div>
                                <div class="message-avatar" v-else-if="message.role === 'assistant/tool_calls'">
                                </div>

                                <div class="message-content" v-if="message.role === 'user'">
                                    <Message.User :message="message" :tab-id="props.tabId" />
                                </div>

                                <div class="message-content" v-else-if="message.role === 'assistant/content'">
                                    <Message.Assistant :message="message" :tab-id="props.tabId" />
                                </div>

                                <div class="message-content" v-else-if="message.role === 'assistant/tool_calls'">
                                    <Message.Toolcall :message="message" :tab-id="props.tabId"
                                        @update:tool-result="(value, toolIndex, index) => message.toolResults[toolIndex][index] = value" />
                                </div>
                            </div>

                            <div v-if="chat.isLoading" class="message-item assistant">
                                <Message.StreamingBox :streaming-content="chat.streamingContent" :tab-id="props.tabId" />
                            </div>
                        </div>
                    </el-scrollbar>
                    <div v-else class="chat-openmcp-icon">
                        <div>
                            <span>{{ getModelName(chat.modelId) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <ChatBox :ref="el => footerRef = el" :tab-id="props.tabId" />
    </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, defineProps, computed, nextTick, watch, provide, watchEffect, onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { type ScrollbarInstance } from 'element-plus';
import { tabs } from '../panel';
import type { ChatMessage, ChatStorage, IRenderMessage, ToolCall, ParallelChatInstance } from './chat-box/chat';
import { MessageState } from './chat-box/chat';

import * as Message from './message';
import ChatBox from './chat-box/index.vue';
import { getToolCallFromXmlString, getToolResultFromXmlString, getXmlsFromString, toNormaliseToolcall } from './core/xml-wrapper';
import { getIdAsIndexAdapter } from './core/handle-tool-calls';
import { llms } from '@/views/setting/llm';


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

// 创建 messages
if (!tabStorage.messages) {
    tabStorage.messages = [] as ChatMessage[];
}

// 初始化并行模式相关数据
if (tabStorage.parallelMode === undefined) {
    tabStorage.parallelMode = false;
}
if (!tabStorage.parallelChats) {
    tabStorage.parallelChats = [];
}
if (!tabStorage.selectedModels) {
    tabStorage.selectedModels = [];
}

// 并行模式状态
const isParallelMode = computed({
    get: () => tabStorage.parallelMode || false,
    set: (value: boolean) => {
        tabStorage.parallelMode = value;
    }
});

const selectedModels = computed({
    get: () => tabStorage.selectedModels || [],
    set: (value: string[]) => {
        tabStorage.selectedModels = value;
    }
});

// 动态LLM配置管理
const originalLlmsLength = ref(0);

// 可用模型列表 - 支持同一供应商多模型
const availableModels = computed(() => {
    const models: Array<{
        id: string;
        name: string;
        configIndex: number;
        modelName: string;
        providerName: string;
        isMultiModel: boolean;
    }> = [];
    
    // 遍历原始LLM配置
    llms.forEach((llm, configIndex) => {
        if (llm.models && llm.models.length > 1) {
            // 如果有多个模型，为每个模型创建选项
            llm.models.forEach((model, modelIndex) => {
                models.push({
                    id: `${configIndex}:${modelIndex}`,
                    name: `${model} (${llm.name})`,
                    configIndex,
                    modelName: model,
                    providerName: llm.name,
                    isMultiModel: true
                });
            });
        } else {
            // 单模型或使用userModel
            models.push({
                id: `${configIndex}:0`,
                name: `${llm.userModel || llm.models?.[0] || 'unknown'} (${llm.name})`,
                configIndex,
                modelName: llm.userModel || llm.models?.[0],
                providerName: llm.name,
                isMultiModel: false
            });
        }
    });
    
    return models;
});

// 搜索关键词
const searchKeyword = ref('');

// 筛选后的模型列表
const filteredModels = computed(() => {
    if (!searchKeyword.value.trim()) {
        return availableModels.value;
    }
    
    const keyword = searchKeyword.value.toLowerCase().trim();
    return availableModels.value.filter(model => {        
        // 支持搜索：模型名称、供应商名称、完整显示名称
        return model.modelName?.toLowerCase().includes(keyword) ||
               model.providerName?.toLowerCase().includes(keyword) ||
               model.name?.toLowerCase().includes(keyword);
    });
});

// 自定义筛选方法
function filterModels(query: string) {
    searchKeyword.value = query;
    return true; // 返回true让el-select使用computed filteredModels
}

// 创建临时LLM配置
function createTempLlmConfig(baseConfig: any, modelName: string, tempIndex: number): any {
    return {
        ...baseConfig,
        id: `${baseConfig.id}_temp_${tempIndex}`,
        userModel: modelName,
        _isTemporary: true,
        _originalIndex: null
    };
}

// 并行聊天实例
const parallelChats = ref<(ParallelChatInstance & { 
    renderMessages: IRenderMessage[], 
    isLoading: boolean, 
    streamingContent: string 
})[]>([]);

// 切换并行模式
function toggleParallelMode() {
    if (isParallelMode.value) {
        // 退出并行模式：清理临时配置
        cleanupTempConfigs();
        parallelChats.value = [];
        selectedModels.value = [];
    } else {
        // 进入并行模式：记录原始配置数量
        originalLlmsLength.value = llms.length;
    }
    isParallelMode.value = !isParallelMode.value;
}

// 清理临时LLM配置
function cleanupTempConfigs() {
    // 安全地移除所有临时配置，使用倒序遍历避免索引问题
    for (let i = llms.length - 1; i >= 0; i--) {
        if (llms[i]._isTemporary) {
            console.log(`[DEBUG] 清理临时配置: ${llms[i].id}`);
            llms.splice(i, 1);
        }
    }
}

// 初始化并行聊天
function initParallelChats() {
    console.log('初始化并行聊天, 选择的模型:', selectedModels.value);
    
    // 首先清理之前的临时配置
    cleanupTempConfigs();
    
    // 为选中的模型创建或找到对应的LLM配置索引
    const modelConfigs = selectedModels.value.map(modelId => {
        const [configIndex, modelIndex] = modelId.split(':').map(Number);
        
        // 验证配置索引有效性
        if (configIndex < 0 || configIndex >= llms.length) {
            console.error(`[ERROR] 无效的配置索引: ${configIndex}`);
            return null;
        }
        
        const baseConfig = llms[configIndex];
        const targetModel = baseConfig.models?.[modelIndex] || baseConfig.userModel;
        
        // 如果是原始配置的第一个模型或者用户自定义模型，直接使用原始索引
        if (modelIndex === 0 || !baseConfig.models || baseConfig.models.length <= 1) {
            return {
                modelId,
                llmIndex: configIndex,
                isOriginal: true
            };
        }
        
        // 检查是否已经存在相同的临时配置
        const existingTempIndex = llms.findIndex(llm => 
            llm._isTemporary && 
            llm.id.startsWith(baseConfig.id) && 
            llm.userModel === targetModel
        );
        
        if (existingTempIndex > -1) {
            console.log(`[DEBUG] 复用已存在的临时配置: ${llms[existingTempIndex].id}`);
            return {
                modelId,
                llmIndex: existingTempIndex,
                isOriginal: false
            };
        }
        
        // 创建新的临时配置
        const tempConfig = createTempLlmConfig(baseConfig, targetModel, llms.length);
        llms.push(tempConfig);
        
        console.log(`[DEBUG] 创建新临时配置: ${tempConfig.id}, 模型: ${targetModel}`);
        
        return {
            modelId,
            llmIndex: llms.length - 1,
            isOriginal: false
        };
    }).filter(config => config !== null); // 过滤掉无效配置
    
    parallelChats.value = modelConfigs.map(({ modelId, llmIndex }) => {
        const existingChat = tabStorage.parallelChats?.find(c => c.modelId === modelId);
        return {
            modelId,
            llmIndex, // 存储实际的LLM索引
            messages: existingChat?.messages || [],
            renderMessages: [],
            isLoading: false,
            streamingContent: ''
        };
    });
    
    console.log('创建的并行聊天实例:', parallelChats.value);
    console.log('当前llms长度:', llms.length);
    
    // 更新存储
    tabStorage.parallelChats = parallelChats.value.map(chat => ({
        modelId: chat.modelId,
        messages: chat.messages
    }));
    
    // 为每个聊天实例计算渲染消息
    parallelChats.value.forEach(chat => {
        updateChatRenderMessages(chat);
    });
}

// 移除并行聊天实例
function removeParallelChat(index: number) {
    const removedChat = parallelChats.value[index];
    
    // 清理对应的临时LLM配置
    if (removedChat.llmIndex !== undefined && removedChat.llmIndex < llms.length && llms[removedChat.llmIndex]?._isTemporary) {
        llms.splice(removedChat.llmIndex, 1);
        
        // 更新其他聊天实例的llmIndex（如果它们的索引大于被删除的索引）
        parallelChats.value.forEach(chat => {
            if (chat.llmIndex !== undefined && removedChat.llmIndex !== undefined && chat.llmIndex > removedChat.llmIndex) {
                chat.llmIndex--;
            }
        });
    }
    
    // 从数组中移除聊天实例
    parallelChats.value.splice(index, 1);
    selectedModels.value = selectedModels.value.filter(id => id !== removedChat.modelId);
    
    // 更新存储
    tabStorage.parallelChats = parallelChats.value.map(chat => ({
        modelId: chat.modelId,
        messages: chat.messages
    }));
    
    // 如果没有剩余的并行聊天了，自动退出并行模式
    if (parallelChats.value.length === 0) {
        isParallelMode.value = false;
        cleanupTempConfigs();
    }
}

// 清空聊天记录（上下文）
function clearChatHistory(index: number) {
    // 确定要清空此对话的上下文吗？
    const chat = parallelChats.value[index];
    chat.messages = [];
    chat.renderMessages = [];
    chat.streamingContent = '';
    
    // 更新存储
    tabStorage.parallelChats = parallelChats.value.map(chat => ({
        modelId: chat.modelId,
        messages: chat.messages
    }));
    
    console.log(`模型 ${chat.modelId} 的上下文已清空`);
}

// 获取模型名称
function getModelName(modelId: string) {
    if (modelId.includes(':')) {
        // 新格式：configIndex:modelIndex
        const [configIndex, modelIndex] = modelId.split(':').map(Number);
        if (!isNaN(configIndex) && configIndex >= 0 && configIndex < llms.length) {
            const llm = llms[configIndex];
            const model = llm.models?.[modelIndex] || llm.userModel;
            return `${model} (${llm.name})`;
        }
    } else {
        // 兼容旧格式
        const index = parseInt(modelId);
        if (!isNaN(index) && index >= 0 && index < llms.length) {
            const llm = llms[index];
            return `${llm.userModel || llm.models?.[0] || 'unknown'} (${llm.name})`;
        }
    }
    return modelId;
}

// 更新聊天实例的渲染消息  
async function updateChatRenderMessages(chat: ParallelChatInstance & { renderMessages: IRenderMessage[] }, streamingToolCalls?: ToolCall[]) {
    console.log(`[DEBUG] updateChatRenderMessages 被调用，模型: ${chat.modelId}，流式工具调用:`, streamingToolCalls?.length || 0);
    
    // 如果只是流式工具调用更新，使用增量更新避免重建整个数组
    if (streamingToolCalls !== undefined) {
        console.log(`[DEBUG] 模型 ${chat.modelId} 进行流式工具调用更新`);
        // 移除之前的流式工具调用（如果存在）
        const lastIndex = chat.renderMessages.length - 1;
        if (lastIndex >= 0 && 
            chat.renderMessages[lastIndex].extraInfo?.serverName === chat.modelId &&
            chat.renderMessages[lastIndex].extraInfo?.state === MessageState.Unknown &&
            !chat.renderMessages[lastIndex].content) {
            chat.renderMessages.splice(lastIndex, 1);
        }
        
        // 如果有新的流式工具调用，添加到末尾
        if (streamingToolCalls.length > 0) {
            chat.renderMessages.push({
                role: 'assistant/tool_calls',
                content: '',
                toolResults: Array(streamingToolCalls.length).fill([]),
                tool_calls: streamingToolCalls.map((call, index) => ({
                    id: call.id || `streaming_${index}`,
                    type: call.type || 'function',
                    index,
                    function: {
                        name: call.function?.name || '',
                        arguments: call.function?.arguments || '{}'
                    }
                })),
                showJson: ref(false),
                extraInfo: {
                    created: Date.now(),
                    state: MessageState.Unknown,
                    serverName: chat.modelId,
                    enableXmlWrapper: false
                }
            });
        }
        return;
    }
    
    // 完整重建渲染消息（仅在消息数组变化时调用）
    const newRenderMessages: IRenderMessage[] = [];
    
    for (const message of chat.messages) {
        // 使用默认的数字索引适配器，避免并行聊天冲突
        const indexAdapter = (toolCall: any) => toolCall.index || 0;        
        const xmls = getXmlToolCalls(message);

        if (message.role === 'user') {
            if (xmls.length > 0 && message.extraInfo.enableXmlWrapper) {
                const lastAssistantMessage = newRenderMessages[newRenderMessages.length - 1];
                if (lastAssistantMessage && lastAssistantMessage.role === 'assistant/tool_calls') {
                    const toolCallResultXmls = getXmlsFromString(message.content);
                    for (const xml of toolCallResultXmls) {
                        const toolResult = await getToolResultFromXmlString(xml);
                        if (toolResult) {
                            const index = indexAdapter(toolResult.callId);
                            lastAssistantMessage.toolResults[index] = toolResult.toolcallContent;
                            if (lastAssistantMessage.extraInfo.state === MessageState.Unknown) {
                                lastAssistantMessage.extraInfo.state = message.extraInfo.state;
                            } else if (lastAssistantMessage.extraInfo.state === MessageState.Success
                                || message.extraInfo.state !== MessageState.Success
                            ) {
                                lastAssistantMessage.extraInfo.state = message.extraInfo.state;
                            }
                            lastAssistantMessage.extraInfo.usage = lastAssistantMessage.extraInfo.usage || message.extraInfo.usage;
                        }
                    }
                }
            } else {
                newRenderMessages.push({
                    role: 'user',
                    content: message.content,
                    extraInfo: message.extraInfo
                });
            }
        } else if (message.role === 'assistant') {
            if (message.tool_calls) {
                newRenderMessages.push({
                    role: 'assistant/tool_calls',
                    content: message.content,
                    toolResults: Array(message.tool_calls.length).fill([]),
                    tool_calls: message.tool_calls,
                    showJson: ref(false),
                    extraInfo: {
                        ...message.extraInfo,
                        state: MessageState.Unknown
                    }
                });
            } else {
                if (xmls.length > 0 && message.extraInfo.enableXmlWrapper) {
                    const toolCalls = [];
                    for (const xml of xmls) {
                        const xmlToolCall = await getToolCallFromXmlString(xml);
                        if (xmlToolCall) {
                            toolCalls.push(
                                toNormaliseToolcall(xmlToolCall, indexAdapter)
                            );
                        }
                    }
                    const renderAssistantMessage = message.content.replace(/```xml[\s\S]*?```/g, '');

                    newRenderMessages.push({
                        role: 'assistant/tool_calls',
                        content: renderAssistantMessage,
                        toolResults: Array(toolCalls.length).fill([]),
                        tool_calls: toolCalls,
                        showJson: ref(false),
                        extraInfo: {
                            ...message.extraInfo,
                            state: MessageState.Unknown
                        }
                    });
                } else {
                    newRenderMessages.push({
                        role: 'assistant/content',
                        content: message.content,
                        extraInfo: message.extraInfo
                    });
                }
            }
        } else if (message.role === 'tool') {
            const lastAssistantMessage = newRenderMessages[newRenderMessages.length - 1];
            if (lastAssistantMessage && lastAssistantMessage.role === 'assistant/tool_calls') {
                lastAssistantMessage.toolResults[message.index] = message.content;
                if (lastAssistantMessage.extraInfo.state === MessageState.Unknown) {
                    lastAssistantMessage.extraInfo.state = message.extraInfo.state;
                } else if (lastAssistantMessage.extraInfo.state === MessageState.Success
                    || message.extraInfo.state !== MessageState.Success
                ) {
                    lastAssistantMessage.extraInfo.state = message.extraInfo.state;
                }
                lastAssistantMessage.extraInfo.usage = lastAssistantMessage.extraInfo.usage || message.extraInfo.usage;
            }
        }
    }
    
    // 一次性更新整个数组，减少响应式触发次数
    console.log(`[DEBUG] 模型 ${chat.modelId} 完整重建渲染消息，共 ${newRenderMessages.length} 条`);
    chat.renderMessages = newRenderMessages;
}

function getXmlToolCalls(message: ChatMessage) {
    if (message.role !== 'assistant' && message.role !== 'user') {
        return [];
    }

    const enableXmlTools = message.extraInfo?.enableXmlWrapper ?? false;
    
    if (!enableXmlTools) {
        return [];
    }

    const xmls = getXmlsFromString(message.content);

    return xmls || [];
}

const renderMessages = ref<IRenderMessage[]>([]);

onMounted(() => {
    initParallelChats();    
});

watchEffect(async () => {
    renderMessages.value = [];
    for (const message of tabStorage.messages) {
        const indexAdapter = getIdAsIndexAdapter();        
        const xmls = getXmlToolCalls(message);

        if (message.role === 'user') {
            if (xmls.length > 0 && message.extraInfo.enableXmlWrapper) {
                // 判断是否是 xml 模式，如果是 xml 模式且存在有效的 xml，则按照工具来判定
                // 往前寻找 assistant/tool_calls 并自动加入其中
                const lastAssistantMessage = renderMessages.value[renderMessages.value.length - 1];
                if (lastAssistantMessage.role === 'assistant/tool_calls') {

                    const toolCallResultXmls = getXmlsFromString(message.content);

                    for (const xml of toolCallResultXmls) {
                        const toolResult = await getToolResultFromXmlString(xml);
                        if (toolResult) {
                            const index = indexAdapter(toolResult.callId);

                            lastAssistantMessage.toolResults[index] = toolResult.toolcallContent;

                            if (lastAssistantMessage.extraInfo.state === MessageState.Unknown) {
                                lastAssistantMessage.extraInfo.state = message.extraInfo.state;
                            } else if (lastAssistantMessage.extraInfo.state === MessageState.Success
                                || message.extraInfo.state !== MessageState.Success
                            ) {
                                lastAssistantMessage.extraInfo.state = message.extraInfo.state;
                            }

                            lastAssistantMessage.extraInfo.usage = lastAssistantMessage.extraInfo.usage || message.extraInfo.usage;
                        }
                    }
                }

            } else {
                renderMessages.value.push({
                    role: 'user',
                    content: message.content,
                    extraInfo: message.extraInfo
                });
            }

        } else if (message.role === 'assistant') {
            if (message.tool_calls) {
                renderMessages.value.push({
                    role: 'assistant/tool_calls',
                    content: message.content,
                    toolResults: Array(message.tool_calls.length).fill([]),
                    tool_calls: message.tool_calls,
                    showJson: ref(false),
                    extraInfo: {
                        ...message.extraInfo,
                        state: MessageState.Unknown
                    }
                });
            } else {
                if (xmls.length > 0 && message.extraInfo.enableXmlWrapper) {
                    // 判断是否是 xml 模式，如果是 xml 模式且存在有效的 xml，则按照工具来判定
                    const toolCalls = [];
                    for (const xml of xmls) {
                        const xmlToolCall = await getToolCallFromXmlString(xml);
                        if (xmlToolCall) {
                            toolCalls.push(
                                toNormaliseToolcall(xmlToolCall, indexAdapter)
                            );
                        }
                    }
                    const renderAssistantMessage = message.content.replace(/```xml[\s\S]*?```/g, '');

                    renderMessages.value.push({
                        role: 'assistant/tool_calls',
                        content: renderAssistantMessage,
                        toolResults: Array(toolCalls.length).fill([]),
                        tool_calls: toolCalls,
                        showJson: ref(false),
                        extraInfo: {
                            ...message.extraInfo,
                            state: MessageState.Unknown
                        }
                    });
                } else {
                    renderMessages.value.push({
                        role: 'assistant/content',
                        content: message.content,
                        extraInfo: message.extraInfo
                    });
                }

            }

        } else if (message.role === 'tool') {
            // 如果是工具，则合并进入 之前 assistant 一起渲染
            const lastAssistantMessage = renderMessages.value[renderMessages.value.length - 1];
            if (lastAssistantMessage.role === 'assistant/tool_calls') {
                lastAssistantMessage.toolResults[message.index] = message.content;

                if (lastAssistantMessage.extraInfo.state === MessageState.Unknown) {
                    lastAssistantMessage.extraInfo.state = message.extraInfo.state;
                } else if (lastAssistantMessage.extraInfo.state === MessageState.Success
                    || message.extraInfo.state !== MessageState.Success
                ) {
                    lastAssistantMessage.extraInfo.state = message.extraInfo.state;
                }

                lastAssistantMessage.extraInfo.usage = lastAssistantMessage.extraInfo.usage || message.extraInfo.usage;
            }
        }
    }
});


const isLoading = ref(false);

const streamingContent = ref('');
const streamingToolCalls = ref<ToolCall[]>([]);

const chatContainerRef = ref<any>(null);
const messageListRef = ref<any>(null);
const footerRef = ref<any>(null);

const scrollHeight = ref('500px');

function updateScrollHeight() {
    if (chatContainerRef.value && footerRef.value) {
        const containerHeight = chatContainerRef.value.clientHeight;
        const footerHeight = footerRef.value.clientHeight;
        scrollHeight.value = `${containerHeight - footerHeight}px`;
    }
}

provide('updateScrollHeight', updateScrollHeight);

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

provide('streamingContent', streamingContent);
provide('streamingToolCalls', streamingToolCalls);
provide('isLoading', isLoading);
provide('autoScroll', autoScroll);

// 提供并行模式相关的数据和方法
provide('isParallelMode', isParallelMode);
provide('parallelChats', parallelChats);
provide('updateChatRenderMessages', updateChatRenderMessages);

const chatContext = {
    handleSend: undefined
};
provide('chatContext', chatContext);

// 组件卸载时清理临时配置
onBeforeUnmount(() => {
    console.log('[DEBUG] 聊天组件卸载，清理临时配置');
    cleanupTempConfigs();
});

// 修改 scrollToBottom 方法
async function scrollToBottom() {
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
}

provide('scrollToBottom', scrollToBottom);

// 添加对 streamingContent 的监听
watch(streamingContent, () => {
    if (autoScroll.value) {
        scrollToBottom();
    }
}, { deep: true });

watch(streamingToolCalls, () => {
    if (autoScroll.value) {
        scrollToBottom();
    }
}, { deep: true });


</script>

<style>
.chat-container {
    height: 100%;
    display: flex;
    position: relative;
    flex-direction: column;
}

.chat-openmcp-icon {
    width: 100%;
    display: flex;
    justify-content: center;
    height: 100%;
    opacity: 0.75;
    padding-top: 70px;
}

.chat-openmcp-icon>div {
    display: flex;
    flex-direction: column;
    align-items: left;
    font-size: 28px;
}

.chat-openmcp-icon>div>span {
    margin-bottom: 23px;
}

.chat-openmcp-icon .iconfont {
    font-size: 22px;
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
    margin-top: 1px;
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
    width: 100%;
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

.assistant.tool_calls {
    margin-top: 5px;
}

.message-text p,
.message-text h3,
.message-text ol,
.message-text ul {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
    line-height: 1.4;
}

.message-text ol li,
.message-text ul li {
    margin-top: 0.2em;
    margin-bottom: 0.2em;
}

/* 新增旋转标记样式 */
.tool-loading {
    display: inline-block;
    margin-left: 8px;
    animation: spin 1s linear infinite;
    color: var(--main-color);
    font-size: 20px;
}


@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* 并行聊天样式 */
.parallel-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background-color: var(--sidebar);
    border-radius: 0.8em 0.8em 0 0;
    border-bottom: 1px solid var(--background);
}

.model-selector {
    display: flex;
    align-items: center;
    gap: 10px;
}

.parallel-chat-container {
    display: flex;
    height: calc(90% - 50px);
    gap: 2px;
    flex: 1;
}

.parallel-chat-instance {
    border-right: 1px solid var(--background);
    display: flex;
    flex-direction: column;
}

.parallel-chat-instance:last-child {
    border-right: none;
}

.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--input-active-background);
    border-bottom: 1px solid var(--background);
    font-size: 12px;
    font-weight: bold;
}

.model-name {
    color: var(--main-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
}

.parallel-chat-instance .message-list {
    max-width: none;
    margin: 0;
    padding: 8px;
    padding-bottom: 50px;
}

.parallel-chat-instance .chat-openmcp-icon {
    padding-top: 30px;
    font-size: 14px;
}

.parallel-chat-instance .message-item {
    margin-bottom: 12px;
}

.parallel-chat-instance .message-avatar {
    margin-right: 8px;
}

.parallel-chat-instance .user .message-avatar {
    margin-right: 0;
    margin-left: 8px;
}
</style>
