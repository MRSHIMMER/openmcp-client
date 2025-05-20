/* eslint-disable */
import { ref, type Ref } from "vue";
import { type ToolCall, type ChatStorage, getToolSchema, MessageState } from "../chat-box/chat";
import { useMessageBridge, MessageBridge, createMessageBridge } from "@/api/message-bridge";
import type { OpenAI } from 'openai';
import { llmManager, llms } from "@/views/setting/llm";
import { pinkLog, redLog } from "@/views/setting/util";
import { ElMessage } from "element-plus";
import { handleToolCalls, type ToolCallResult } from "./handle-tool-calls";
import { getPlatform } from "@/api/platform";
import { getSystemPrompt } from "../chat-box/options/system-prompt";

export type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk;
export type ChatCompletionCreateParamsBase = OpenAI.Chat.Completions.ChatCompletionCreateParams & { id?: string };
export interface TaskLoopOptions {
    maxEpochs?: number;
    maxJsonParseRetry?: number;
    adapter?: any;
}

export interface IErrorMssage {
    state: MessageState,
    msg: string
}

export interface IDoConversationResult {
    stop: boolean;
}


/**
 * @description 对任务循环进行的抽象封装
 */
export class TaskLoop {
    private bridge: MessageBridge;
    private streamingContent: Ref<string>;
    private streamingToolCalls: Ref<ToolCall[]>;

    private currentChatId = '';
    private onError: (error: IErrorMssage) => void = (msg) => {};
    private onChunk: (chunk: ChatCompletionChunk) => void = (chunk) => {};
    private onDone: () => void = () => {};
    private onToolCall: (toolCall: ToolCall) => ToolCall = toolCall => toolCall;
    private onToolCalled: (toolCallResult: ToolCallResult) => ToolCallResult = toolCallResult => toolCallResult;
    private onEpoch: () => void = () => {};
    private completionUsage: ChatCompletionChunk['usage'] | undefined;
    private llmConfig: any;

    constructor(
        private readonly taskOptions: TaskLoopOptions = { maxEpochs: 20, maxJsonParseRetry: 3, adapter: undefined },
    ) {
        this.streamingContent = ref('');
        this.streamingToolCalls = ref([]);

        // 根据当前环境决定是否要开启 messageBridge
        const platform = getPlatform();
        if (platform === 'nodejs') {
            const adapter = taskOptions.adapter;

            if (!adapter) {
                throw new Error('adapter is required');
            }

            createMessageBridge(adapter.emitter);
        }

        // web 环境下 bridge 会自动加载完成
        this.bridge = useMessageBridge();
    }

    private handleChunkDeltaContent(chunk: ChatCompletionChunk) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
            this.streamingContent.value += content;
        }
    }

    private handleChunkDeltaToolCalls(chunk: ChatCompletionChunk) {
        const toolCall = chunk.choices[0]?.delta?.tool_calls?.[0];
        
        if (toolCall) {
            const currentCall = this.streamingToolCalls.value[toolCall.index];

            if (currentCall === undefined) {
                // 新的工具调用开始
                this.streamingToolCalls.value[toolCall.index] = {
                    id: toolCall.id,
                    index: toolCall.index,
                    type: 'function',
                    function: {
                        name: toolCall.function?.name || '',
                        arguments: toolCall.function?.arguments || ''
                    }
                };
            } else {
                // 累积现有工具调用的信息
                if (currentCall) {
                    if (toolCall.id) {
                        currentCall.id = toolCall.id;
                    }
                    if (toolCall.function?.name) {
                        currentCall.function.name = toolCall.function.name;
                    }
                    if (toolCall.function?.arguments) {
                        currentCall.function.arguments += toolCall.function.arguments;                        
                    }
                }
            }

        }        
    }

    private handleChunkUsage(chunk: ChatCompletionChunk) {
        const usage = chunk.usage;
        if (usage) {
            this.completionUsage = usage;
        }
    }

    private doConversation(chatData: ChatCompletionCreateParamsBase) {

        return new Promise<IDoConversationResult>((resolve, reject) => {
            const chunkHandler = this.bridge.addCommandListener('llm/chat/completions/chunk', data => {
                // data.code 一定为 200，否则不会走这个 route
                const { chunk } = data.msg as { chunk: ChatCompletionChunk };

                // 处理增量的 content 和 tool_calls
                this.handleChunkDeltaContent(chunk);
                this.handleChunkDeltaToolCalls(chunk);
                this.handleChunkUsage(chunk);
                
                this.onChunk(chunk);
            }, { once: false });
        
            const doneHandler = this.bridge.addCommandListener('llm/chat/completions/done', data => {                
                this.onDone();
                chunkHandler();
                errorHandler();

                resolve({
                    stop: false
                });
            }, { once: true });

            const errorHandler = this.bridge.addCommandListener('llm/chat/completions/error', data => {
                this.onError({
                    state: MessageState.ReceiveChunkError,
                    msg: data.msg || '请求模型服务时发生错误'
                });

                chunkHandler();
                doneHandler();

                resolve({
                    stop: true
                });

            }, { once: true });

            console.log(chatData);

            this.bridge.postMessage({
                command: 'llm/chat/completions',
                data: JSON.parse(JSON.stringify(chatData)),
            });
        });
    }

    public makeChatData(tabStorage: ChatStorage): ChatCompletionCreateParamsBase | undefined {
        const baseURL = this.getLlmConfig().baseUrl;
        const apiKey = this.getLlmConfig().userToken || '';
        
        if (apiKey.trim() === '') {
            
            if (tabStorage.messages.length > 0 && tabStorage.messages[tabStorage.messages.length - 1].role === 'user') {
                tabStorage.messages.pop();
                ElMessage.error('请先设置 API Key');
            }
            return undefined;
        }
    
        const model = this.getLlmConfig().userModel;
        const temperature = tabStorage.settings.temperature;
        const tools = getToolSchema(tabStorage.settings.enableTools);

        const userMessages = [];

        // 尝试获取 system prompt，在 api 模式下，systemPrompt 就是目标提词
        // 但是在 UI 模式下，systemPrompt 只是一个 index，需要从后端数据库中获取真实 prompt
        if (tabStorage.settings.systemPrompt) {
            const prompt = getSystemPrompt(tabStorage.settings.systemPrompt) || tabStorage.settings.systemPrompt;
            
            userMessages.push({
                role: 'system',
                content: prompt
            });
        }

        // 如果超出了 tabStorage.settings.contextLength, 则删除最早的消息
        const loadMessages = tabStorage.messages.slice(- tabStorage.settings.contextLength);
        userMessages.push(...loadMessages);

        // 增加一个id用于锁定状态
        const id = crypto.randomUUID();

        const chatData = {
            id,
            baseURL,
            apiKey,
            model,
            temperature,
            tools,
            messages: userMessages,
        } as ChatCompletionCreateParamsBase;

        return chatData;
    }

    public abort() {
        this.bridge.postMessage({
            command: 'llm/chat/completions/abort',
            data: {
                id: this.currentChatId
            }
        });
        this.streamingContent.value = '';
        this.streamingToolCalls.value = [];
    }

    /**
     * @description 注册 error 发生时触发的回调函数
     * @param handler 
     */
    public registerOnError(handler: (msg: IErrorMssage) => void) {
        this.onError = handler;
    }

    public registerOnChunk(handler: (chunk: ChatCompletionChunk) => void) {
        this.onChunk = handler;
    }
    
    /**
     * @description 注册 chat.completion 完成时触发的回调函数
     * @param handler 
     */
    public registerOnDone(handler: () => void) {
        this.onDone = handler;
    }

    /**
     * @description 注册每一个 epoch 开始时触发的回调函数
     * @param handler 
     */
    public registerOnEpoch(handler: () => void) {
        this.onEpoch = handler;
    }

    /**
     * @description 注册当工具调用前的回调函数，可以拦截并修改 toolcall 的输入
     * @param handler 
     */
    public registerOnToolCall(handler: (toolCall: ToolCall) => ToolCall) {
        this.onToolCall = handler;
    }

    /**
     * @description 注册当工具调用完成时的回调函数，会调用这个方法，可以拦截并修改 toolcall 的输出
     * @param handler 
     */
    public registerOnToolCalled(handler: (toolCallResult: ToolCallResult) => ToolCallResult) {
        this.onToolCalled = handler;
    }

    public setMaxEpochs(maxEpochs: number) {
        this.taskOptions.maxEpochs = maxEpochs;
    }

    /**
     * @description 设置当前的 LLM 配置，用于 nodejs 环境运行
     * @param config 
     * @example
     * setLlmConfig({
     *     id: 'openai',
     *     baseUrl: 'https://api.openai.com/v1',
     *     userToken: 'sk-xxx',
     *     userModel: 'gpt-3.5-turbo',
     * })
     */
    public setLlmConfig(config: any) {
        this.llmConfig = config;
    }

    public bindStreaming(content: Ref<string>, toolCalls: Ref<ToolCall[]>) {
        this.streamingContent = content;
        this.streamingToolCalls = toolCalls;
    }

    public getLlmConfig() {
        if (this.llmConfig) {
            return this.llmConfig;
        }
        return llms[llmManager.currentModelIndex];
    }

    public async connectToService() {
        
    }

    /**
     * @description 开启循环，异步更新 DOM
     */
    public async start(tabStorage: ChatStorage, userMessage: string) {
        // 添加目前的消息
        tabStorage.messages.push({
            role: 'user',
            content: userMessage,
            extraInfo: {
                created: Date.now(),
                state: MessageState.Success,
                serverName: this.getLlmConfig().id || 'unknown'
            }
        });

        let jsonParseErrorRetryCount = 0;
        const maxEpochs = this.taskOptions.maxEpochs || 20;

        for (let i = 0; i < maxEpochs; ++ i) {

            this.onEpoch();

            // 初始累计清空
            this.streamingContent.value = '';
            this.streamingToolCalls.value = [];
            this.completionUsage = undefined;

            // 构造 chatData
            const chatData = this.makeChatData(tabStorage);

            if (!chatData) {
                this.onDone();
                break;
            }

            this.currentChatId = chatData.id!;

            // 发送请求
            const doConverationResult = await this.doConversation(chatData);

            console.log('[doConverationResult] Response');
            console.log(doConverationResult);

            // 如果存在需要调度的工具
            if (this.streamingToolCalls.value.length > 0) {

                tabStorage.messages.push({
                    role: 'assistant',
                    content: this.streamingContent.value || '',
                    tool_calls: this.streamingToolCalls.value,
                    extraInfo: {
                        created: Date.now(),
                        state: MessageState.Success,
                        serverName: this.getLlmConfig().id || 'unknown'
                    }
                });
                
                pinkLog('调用工具数量：' + this.streamingToolCalls.value.length);

                for (let toolCall of this.streamingToolCalls.value || []) {

                    toolCall = this.onToolCall(toolCall);
                    let toolCallResult = await handleToolCalls(toolCall);
                    toolCallResult = this.onToolCalled(toolCallResult);
    
                    if (toolCallResult.state === MessageState.ParseJsonError) {
                        // 如果是因为解析 JSON 错误，则重新开始
                        tabStorage.messages.pop();
                        jsonParseErrorRetryCount ++;
    
                        redLog('解析 JSON 错误 ' + toolCall?.function?.arguments);
    
                        // 如果因为 JSON 错误而失败太多，就只能中断了
                        if (jsonParseErrorRetryCount >= (this.taskOptions.maxJsonParseRetry || 3)) {
                            tabStorage.messages.push({
                                role: 'assistant',
                                content: `解析 JSON 错误，无法继续调用工具 (累计错误次数 ${this.taskOptions.maxJsonParseRetry})`,
                                extraInfo: {
                                    created: Date.now(),
                                    state: toolCallResult.state,
                                    serverName: this.getLlmConfig().id || 'unknown',
                                    usage: undefined
                                }
                            });
                            break;
                        }
                    } else if (toolCallResult.state === MessageState.Success) {
                        tabStorage.messages.push({
                            role: 'tool',
                            index: toolCall.index || 0,
                            tool_call_id: toolCall.id || toolCall.function.name,
                            content: toolCallResult.content,
                            extraInfo: {
                                created: Date.now(),
                                state: toolCallResult.state,
                                serverName: this.getLlmConfig().id || 'unknown',
                                usage: this.completionUsage
                            }
                        });
                    } else if (toolCallResult.state === MessageState.ToolCall) {
    
                        tabStorage.messages.push({
                            role: 'tool',
                            index: toolCall.index || 0,
                            tool_call_id: toolCall.id || toolCall.function.name,
                            content: toolCallResult.content,
                            extraInfo: {
                                created: Date.now(),
                                state: toolCallResult.state,
                                serverName: this.getLlmConfig().id || 'unknown',
                                usage: this.completionUsage
                            }
                        });
                    }
                }

            } else if (this.streamingContent.value) {
                tabStorage.messages.push({
                    role: 'assistant',
                    content: this.streamingContent.value,
                    extraInfo: {
                        created: Date.now(),
                        state: MessageState.Success,
                        serverName: this.getLlmConfig().id || 'unknown',
                        usage: this.completionUsage
                    }
                });
                break;

            } else {
                // 一些提示
                break;
            }

            // 回答聚合完成后根据 stop 来决定是否提前中断
            if (doConverationResult.stop) {
                break;
            }
        }
    }
}