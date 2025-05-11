/* eslint-disable */
import type { OpenAI } from 'openai';

export type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk;
export type ChatCompletionCreateParamsBase = OpenAI.Chat.Completions.ChatCompletionCreateParams & { id?: string };

export interface TaskLoopOptions {
    maxEpochs?: number;
    maxJsonParseRetry?: number;
    adapter?: any;
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
    registerOnError(handler: (msg: IErrorMssage) => void): void;
    registerOnChunk(handler: (chunk: ChatCompletionChunk) => void): void;
    registerOnDone(handler: () => void): void;
    registerOnEpoch(handler: () => void): void;
    setMaxEpochs(maxEpochs: number): void;
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
    getLlmConfig(): any;
    bindStreaming(content: Ref<string>, toolCalls: Ref<ToolCall[]>): void;
    connectToService(): Promise<void>;
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
