/* eslint-disable */
import { ref, type Ref } from "vue";
import { type ToolCall, type ChatStorage, getToolSchema, MessageState, type ChatMessage } from "../chat-box/chat";
import { useMessageBridge, MessageBridge, createMessageBridge } from "@/api/message-bridge";
import type { OpenAI } from 'openai';
import { llmManager, llms, type BasicLlmDescription } from "@/views/setting/llm";
import { redLog } from "@/views/setting/util";
import { ElMessage } from "element-plus";
import { getToolCallIndexAdapter, handleToolCalls, type IToolCallIndex, type ToolCallResult } from "./handle-tool-calls";
import { getPlatform } from "@/api/platform";
import { getSystemPrompt } from "../chat-box/options/system-prompt";
import { mcpSetting } from "@/hook/mcp";
import { mcpClientAdapter } from "@/views/connect/core";
import type { ToolItem } from "@/hook/type";
import chalk from 'chalk';
import { getXmlWrapperPrompt, getToolCallFromXmlString, getXmlsFromString, handleXmlWrapperToolcall, toNormaliseToolcall, getXmlResultPrompt } from "./xml-wrapper";

export type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk;
export interface TaskLoopChatOption {
    id?: string
    proxyServer?: string
    enableXmlWrapper?: boolean
}
export type ChatCompletionCreateParamsBase = OpenAI.Chat.Completions.ChatCompletionCreateParams & TaskLoopChatOption;
export interface TaskLoopOptions {
    maxEpochs?: number;
    maxJsonParseRetry?: number;
    adapter?: any;
    verbose?: 0 | 1 | 2 | 3;
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
    private onError: (error: IErrorMssage) => void = (msg) => { };
    private onChunk: (chunk: ChatCompletionChunk) => void = (chunk) => { };
    private onDone: () => void = () => { };
    private onToolCall: (toolCall: ToolCall) => ToolCall = toolCall => toolCall;
    private onToolCalled: (toolCallResult: ToolCallResult) => ToolCallResult = toolCallResult => toolCallResult;
    private onEpoch: () => void = () => { };
    private completionUsage: ChatCompletionChunk['usage'] | undefined;
    private llmConfig?: BasicLlmDescription;

    // 只会在 nodejs 环境下使用的部分变量
    private nodejsStatus = {
        connectionFut: new Promise<void>(resolve => resolve(void 0))
    };

    constructor(
        private readonly taskOptions: TaskLoopOptions = {
            maxEpochs: 20,
            maxJsonParseRetry: 3,
            adapter: undefined,
            verbose: 0
        },
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
            this.nodejsStatus.connectionFut = mcpClientAdapter.launch();
        }

        // web 环境下 bridge 会自动加载完成
        this.bridge = useMessageBridge();
    }

    /**
     * @description 处理 streaming 输出的每一个分块的 content 部分 
     * @param chunk 
     * @param chatData 
     */
    private handleChunkDeltaContent(chunk: ChatCompletionChunk, chatData: ChatCompletionCreateParamsBase) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
            this.streamingContent.value += content;
        }
    }

    /**
     * @description 处理 streaming 输出的每一个 chunk 的 tool_calls 部分
     * @param chunk 
     * @param chatData 
     * @param toolcallIndexAdapter 
     */
    private handleChunkDeltaToolCalls(chunk: ChatCompletionChunk, chatData: ChatCompletionCreateParamsBase, toolcallIndexAdapter: (toolCall: ToolCall) => IToolCallIndex) {
        const toolCall = chunk.choices[0]?.delta?.tool_calls?.[0];

        if (toolCall) {
            if (toolCall.index === undefined || toolCall.index === null) {
                console.warn('tool_call.index is undefined or null');
            }


            const index = toolcallIndexAdapter(toolCall);
            const currentCall = this.streamingToolCalls.value[index];

            if (currentCall === undefined) {
                // 新的工具调用开始
                this.streamingToolCalls.value[index] = {
                    id: toolCall.id,
                    index,
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
                        currentCall.function!.name = toolCall.function.name;
                    }
                    if (toolCall.function?.arguments) {
                        currentCall.function!.arguments += toolCall.function.arguments;
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

    private doConversation(chatData: ChatCompletionCreateParamsBase, toolcallIndexAdapter: (toolCall: ToolCall) => IToolCallIndex) {

        return new Promise<IDoConversationResult>((resolve, reject) => {
            const chunkHandler = this.bridge.addCommandListener('llm/chat/completions/chunk', data => {
                // data.code 一定为 200，否则不会走这个 route
                const { chunk } = data.msg as { chunk: ChatCompletionChunk };

                // 处理增量的 content 和 tool_calls
                if (chatData.enableXmlWrapper) {
                    this.handleChunkDeltaContent(chunk, chatData);
                    // no tool call in enableXmlWrapper
                    this.handleChunkUsage(chunk);
                } else {
                    this.handleChunkDeltaContent(chunk, chatData);
                    this.handleChunkDeltaToolCalls(chunk, chatData, toolcallIndexAdapter);
                    this.handleChunkUsage(chunk);
                }

                this.consumeChunks(chunk);
            }, { once: false });

            const doneHandler = this.bridge.addCommandListener('llm/chat/completions/done', data => {
                this.consumeDones();

                chunkHandler();
                errorHandler();

                resolve({
                    stop: false
                });
            }, { once: true });

            const errorHandler = this.bridge.addCommandListener('llm/chat/completions/error', data => {
                this.consumeErrors({
                    state: MessageState.ReceiveChunkError,
                    msg: data.msg || '请求模型服务时发生错误'
                });

                chunkHandler();
                doneHandler();

                resolve({
                    stop: true
                });

            }, { once: true });

            this.bridge.postMessage({
                command: 'llm/chat/completions',
                data: JSON.parse(JSON.stringify(chatData)),
            });
        });
    }

    public setProxyServer(proxyServer: string) {
        mcpSetting.proxyServer = proxyServer;
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
        const parallelToolCalls = tabStorage.settings.parallelToolCalls;
        const proxyServer = mcpSetting.proxyServer || '';

        // 如果是 xml 模式，则 tools 为空
        const enableXmlWrapper = tabStorage.settings.enableXmlWrapper;
        const tools = enableXmlWrapper ? []: getToolSchema(tabStorage.settings.enableTools);

        const userMessages = [];

        // 尝试获取 system prompt，在 api 模式下，systemPrompt 就是目标提词
        // 但是在 UI 模式下，systemPrompt 只是一个 index，需要从后端数据库中获取真实 prompt

        let prompt = '';

        // 如果存在系统提示词，则从数据库中获取对应的数据
        if (tabStorage.settings.systemPrompt) {
            prompt += getSystemPrompt(tabStorage.settings.systemPrompt) || tabStorage.settings.systemPrompt;
        }

        // 如果是 xml 模式，则在开头注入 xml
        if (enableXmlWrapper) {
            prompt += getXmlWrapperPrompt(tabStorage.settings.enableTools, tabStorage);
        }

        userMessages.push({
            role: 'system',
            content: prompt
        });

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
            parallelToolCalls,
            messages: userMessages,
            proxyServer,
            enableXmlWrapper,
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

    private consumeErrors(error: IErrorMssage) {
        const { verbose = 0 } = this.taskOptions;
        if (verbose > 0) {
            console.log(
                chalk.gray(`[${new Date().toLocaleString()}]`),
                chalk.red('error happen in task loop '),
                chalk.red(error.msg)
            );
        }
        return this.onError(error);
    }

    private consumeChunks(chunk: ChatCompletionChunk) {
        const { verbose = 0 } = this.taskOptions;
        if (verbose > 1) {
            console.log(
                chalk.gray(`[${new Date().toLocaleString()}]`),
                chalk.blue('receive chunk')
            );
        } else if (verbose > 2) {
            const delta = chunk.choices[0]?.delta;
            if (delta) {
                console.log(
                    chalk.gray(`[${new Date().toLocaleString()}]`),
                    chalk.blue('receive chunk'),
                    chalk.bold(JSON.stringify(delta, null, 2))
                );
            } else {
                console.log(
                    chalk.gray(`[${new Date().toLocaleString()}]`),
                    chalk.blue('receive chunk'),
                    chalk.blue('delta is empty')
                );
            }
        }
        return this.onChunk(chunk);
    }

    private consumeToolCalls(toolCall: ToolCall) {
        const { verbose = 0 } = this.taskOptions;

        if (verbose > 0) {
            console.log(
                chalk.gray(`[${new Date().toLocaleString()}]`),
                chalk.blueBright('🔧 calling tool'),
                chalk.blueBright(toolCall.function!.name)
            );
        }

        return this.onToolCall(toolCall);
    }

    private consumeToolCalleds(result: ToolCallResult) {
        const { verbose = 0 } = this.taskOptions;
        if (verbose > 0) {
            if (result.state === 'success') {
                console.log(
                    chalk.gray(`[${new Date().toLocaleString()}]`),
                    chalk.green('✓ call tools okey dockey'),
                    chalk.green(result.state)
                );
            } else {
                console.log(
                    chalk.gray(`[${new Date().toLocaleString()}]`),
                    chalk.red('× fail to call tools'),
                    chalk.red(result.content.map(item => item.text).join(', '))
                );
            }
        }
        return this.onToolCalled(result);
    }

    private consumeEpochs() {
        const { verbose = 0 } = this.taskOptions;
        if (verbose > 0) {
            console.log(
                chalk.gray(`[${new Date().toLocaleString()}]`),
                chalk.blue('task loop enters a new epoch')
            );
        }
        return this.onEpoch();
    }

    private consumeDones() {
        const { verbose = 0 } = this.taskOptions;
        if (verbose > 0) {
            console.log(
                chalk.gray(`[${new Date().toLocaleString()}]`),
                chalk.green('task loop finish a epoch')
            );
        }
        return this.onDone();
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

    public async listTools() {
        const platform = getPlatform();
        if (platform === 'nodejs') {
            // 等待连接完成
            await this.nodejsStatus.connectionFut;
        }

        const allTools = [] as ToolItem[];
        for (const client of mcpClientAdapter.clients) {
            if (!client.connected) {
                continue;
            }

            const tools = await client.getTools();
            allTools.push(...Array.from(tools.values()).map(
                item => ({
                    ...item,
                    enabled: true
                })
            ));
        }

        return allTools;
    }

    /**
     * @description 开启循环，异步更新 DOM
     */
    public async start(tabStorage: ChatStorage, userMessage: string) {

        const platform = getPlatform();
        if (platform === 'nodejs') {
            // 等待连接完成            
            await this.nodejsStatus.connectionFut;
        }
        const enableXmlWrapper = tabStorage.settings.enableXmlWrapper;

        // 添加目前的消息
        tabStorage.messages.push({
            role: 'user',
            content: userMessage,
            extraInfo: {
                created: Date.now(),
                state: MessageState.Success,
                serverName: this.getLlmConfig().id || 'unknown',
                enableXmlWrapper
            }
        });

        let jsonParseErrorRetryCount = 0;
        const {
            maxEpochs = 20,
            verbose = 0
        } = this.taskOptions || {};

        for (let i = 0; i < maxEpochs; ++i) {

            this.consumeEpochs();

            // 初始累计清空
            this.streamingContent.value = '';
            this.streamingToolCalls.value = [];
            this.completionUsage = undefined;

            // 构造 chatData
            const chatData = this.makeChatData(tabStorage);

            if (!chatData) {
                this.consumeDones();
                break;
            }

            this.currentChatId = chatData.id!;
            const llm = this.getLlmConfig();
            const toolcallIndexAdapter = getToolCallIndexAdapter(llm, chatData);

            // 发送请求
            const doConverationResult = await this.doConversation(chatData, toolcallIndexAdapter);

            // 如果存在需要调度的工具
            if (this.streamingToolCalls.value.length > 0) {

                tabStorage.messages.push({
                    role: 'assistant',
                    content: this.streamingContent.value || '',
                    tool_calls: this.streamingToolCalls.value,
                    extraInfo: {
                        created: Date.now(),
                        state: MessageState.Success,
                        serverName: this.getLlmConfig().id || 'unknown',
                        enableXmlWrapper
                    }
                });

                if (verbose > 0) {
                    console.log(
                        chalk.gray(`[${new Date().toLocaleString()}]`),
                        chalk.yellow('🤖 llm wants to call these tools'),
                        chalk.yellow(this.streamingToolCalls.value.map(tool => tool.function!.name || '').join(', '))
                    );
                }

                for (let toolCall of this.streamingToolCalls.value || []) {

                    // ready to call tools
                    toolCall = this.consumeToolCalls(toolCall);
                    let toolCallResult = await handleToolCalls(toolCall);

                    // hook : finish call tools
                    toolCallResult = this.consumeToolCalleds(toolCallResult);

                    if (toolCallResult.state === MessageState.ParseJsonError) {
                        // 如果是因为解析 JSON 错误，则重新开始
                        tabStorage.messages.pop();
                        jsonParseErrorRetryCount++;

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
                                    usage: undefined,
                                    enableXmlWrapper
                                }
                            });
                            break;
                        }
                    } else if (toolCallResult.state === MessageState.Success) {
                        tabStorage.messages.push({
                            role: 'tool',
                            index: toolcallIndexAdapter(toolCall),
                            tool_call_id: toolCall.id || '',
                            content: toolCallResult.content,
                            extraInfo: {
                                created: Date.now(),
                                state: toolCallResult.state,
                                serverName: this.getLlmConfig().id || 'unknown',
                                usage: this.completionUsage,
                                enableXmlWrapper
                            }
                        });
                    } else if (toolCallResult.state === MessageState.ToolCall) {

                        tabStorage.messages.push({
                            role: 'tool',
                            index: toolcallIndexAdapter(toolCall),
                            tool_call_id: toolCall.id || toolCall.function!.name,
                            content: toolCallResult.content,
                            extraInfo: {
                                created: Date.now(),
                                state: toolCallResult.state,
                                serverName: this.getLlmConfig().id || 'unknown',
                                usage: this.completionUsage,
                                enableXmlWrapper
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
                        usage: this.completionUsage,
                        enableXmlWrapper
                    }
                });

                // 如果 xml 模型，需要检查内部是否含有有效的 xml 进行调用
                if (tabStorage.settings.enableXmlWrapper) {
                    const xmls = getXmlsFromString(this.streamingContent.value);
                    if (xmls.length === 0) {
                        // 没有 xml 了，说明对话结束
                        break;
                    }

                    // 使用 user 作为身份来承载 xml 调用的结果
                    // 并且在 extra 内存储结构化信息
                    const fakeUserMessage = {
                        role: 'user',
                        content: '',
                        extraInfo: {
                            created: Date.now(),
                            state: MessageState.Success,
                            serverName: this.getLlmConfig().id || 'unknown',
                            usage: this.completionUsage,
                            enableXmlWrapper,
                        }
                    } as ChatMessage;

                    // 有 xml 了，需要检查 xml 内部是否有有效的 xml 进行调用
                    for (const xml of xmls) {
                        const toolcall = await getToolCallFromXmlString(xml);

                        if (!toolcall) {
                            continue;
                        }
                        
                        // toolcall 事件
                        // 此处使用的是 xml 使用的 toolcall，为了保持一致性，需要转换成 openai 标准下的 toolcall
                        const normaliseToolcall = toNormaliseToolcall(toolcall, toolcallIndexAdapter);
                        this.consumeToolCalls(normaliseToolcall);

                        // 调用 XML 调用，其实可以考虑后续把这个循环改成 Promise.race
                        const toolCallResult = await handleXmlWrapperToolcall(toolcall);

                        // toolcalled 事件
                        // 因为是交付给后续进行统一消费的，所以此处的输出满足 openai 接口规范
                        this.consumeToolCalleds(toolCallResult);

                        // XML 模式下只存在 assistant 和 user 这两个角色，因此，以 user 为身份来存储
                        if (toolCallResult.state === MessageState.InvalidXml) {
                            // 如果是因为解析 XML 错误，则重新开始
                            tabStorage.messages.pop();
                            jsonParseErrorRetryCount ++;
    
                            redLog('解析 XML 错误 ' + normaliseToolcall?.function?.arguments);
    
                            // 如果因为 XML 错误而失败太多，就只能中断了
                            if (jsonParseErrorRetryCount >= (this.taskOptions.maxJsonParseRetry || 3)) {

                                const prompt = getXmlResultPrompt(toolcall.callId, `解析 XML 错误，无法继续调用工具 (累计错误次数 ${this.taskOptions.maxJsonParseRetry})`);

                                fakeUserMessage.content += prompt;

                                break;
                            }
                        } else if (toolCallResult.state === MessageState.Success) {
                            // TODO: xml 目前只支持 text 类型的回复
                            const toolCallResultString = toolCallResult.content
                                .filter(c => c.type === 'text')
                                .map(c => c.text)
                                .join('\n');

                            fakeUserMessage.content += getXmlResultPrompt(toolcall.callId, toolCallResultString);

                        } else if (toolCallResult.state === MessageState.ToolCall) {
                            // TODO: xml 目前只支持 text 类型的回复
                            const toolCallResultString = toolCallResult.content
                                .filter(c => c.type === 'text')
                                .map(c => c.text)
                                .join('\n');

                            fakeUserMessage.content += getXmlResultPrompt(toolcall.callId, toolCallResultString);
                        }
                    }

                    tabStorage.messages.push(fakeUserMessage);

                } else {
                    // 普通对话直接结束
                    break;
                }

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