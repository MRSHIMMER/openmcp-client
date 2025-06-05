/* eslint-disable */
import type { OpenAI } from 'openai';

export type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk;
export type ChatCompletionCreateParamsBase = OpenAI.Chat.Completions.ChatCompletionCreateParams & { id?: string };

export interface TaskLoopOptions {
    maxEpochs?: number;
    maxJsonParseRetry?: number;
    adapter?: any;
    verbose?: 0 | 1 | 2 | 3;
}

export interface SchemaProperty {
	title: string;
	type: string;
	description?: string;
}

export interface InputSchema {
	type: string;
	properties: Record<string, SchemaProperty>;
	required?: string[];
	title?: string;
	$defs?: any;
}

export interface ToolItem {
	name: string;
	description: string;
	inputSchema: InputSchema;
    enabled: boolean;
	anyOf?: any;
}

export type Ref<T> = {
    value: T;
};

export interface ToolCall {
    id?: string;
    index?: number;
    type: string;
    function: {
        name: string;
        arguments: string;
    }
}

export interface ToolCallContent {
    type: string;
    text: string;
	[key: string]: any;
}

export interface ToolCallResult {
    state: MessageState;
    content: ToolCallContent[];
}

export enum MessageState {
    ServerError = 'server internal error',
    ReceiveChunkError = 'receive chunk error',
    Timeout = 'timeout',
    MaxEpochs = 'max epochs',
    Unknown = 'unknown error',
    Abort = 'abort',
    ToolCall = 'tool call failed',
    None = 'none',
    Success = 'success',
    ParseJsonError = 'parse json error'
}

export interface IErrorMssage {
    state: MessageState;
    msg: string;
}

export interface IDoConversationResult {
    stop: boolean;
}

/**
 * @description 对任务循环进行的抽象封装
 */
export class TaskLoop {
    private streamingContent;
    private streamingToolCalls;
    private readonly taskOptions;
    private bridge;
    private currentChatId;
    private onError;
    private onChunk;
    private onDone;
    private onToolCalled;
    private onEpoch;
    private completionUsage;
    private llmConfig;
    constructor(taskOptions?: TaskLoopOptions);
    private handleChunkDeltaContent;
    private handleChunkDeltaToolCalls;
    private handleChunkUsage;
    private doConversation;
    makeChatData(tabStorage: any): ChatCompletionCreateParamsBase | undefined;
    abort(): void;

    /**
     * @description 注册 error 发生时触发的回调函数
     * @param handler 
     */
    registerOnError(handler: (msg: IErrorMssage) => void): void;
    registerOnChunk(handler: (chunk: ChatCompletionChunk) => void): void;

    /**
     * @description 注册 chat.completion 完成时触发的回调函数
     * @param handler 
     */
    registerOnDone(handler: () => void): void;

    /**
     * @description 注册每一个 epoch 开始时触发的回调函数
     * @param handler 
     */
    registerOnEpoch(handler: () => void): void;

    /**
     * @description 注册当工具调用完成时的回调函数，会调用这个方法，可以拦截并修改 toolcall 的输出
     * @param handler 
     */
    registerOnToolCalled(handler: (toolCallResult: ToolCallResult) => ToolCallResult): void;

    /**
     * @description 注册当工具调用前的回调函数，可以拦截并修改 toolcall 的输入
     * @param handler 
     */
    registerOnToolCall(handler: (toolCall: ToolCall) => ToolCall): void;

    /**
     * @description 获取当前的 LLM 配置
     */
    getLlmConfig(): any;

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
    setLlmConfig(config: any): void;

    /**
     * @description 设置最大 epoch 次数
     * @param maxEpochs 
     */
    setMaxEpochs(maxEpochs: number): void;
    bindStreaming(content: Ref<string>, toolCalls: Ref<ToolCall[]>): void;
    connectToService(): Promise<void>;

    /**
     * @description 设置代理服务器
     * @param proxyServer 
     */
    setProxyServer(proxyServer: string): void;

    /**
     * @description 获取所有可用的工具列表
     */
    listTools(): Promise<ToolItem[]>;

    /**
     * @description 开启循环，异步更新 DOM
     */
    start(tabStorage: any, userMessage: string): Promise<void>;
}

export declare const getToolSchema: any;
export declare const useMessageBridge: any;
export declare const llmManager: any;
export declare const llms: any;
export declare const pinkLog: any;
export declare const redLog: any;
export declare const ElMessage: any;
export declare const handleToolCalls: any;
export declare const getPlatform: any;
