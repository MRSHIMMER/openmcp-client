import { Ref } from "vue";
import { ToolCall, ChatMessage, ChatStorage, getToolSchema } from "./chat";
import { useMessageBridge } from "@/api/message-bridge";
import type { OpenAI } from 'openai';
import { callTool } from "../tool/tools";
import { llmManager, llms } from "@/views/setting/llm";

type ChatCompletionChunk = OpenAI.Chat.Completions.ChatCompletionChunk;
type ChatCompletionCreateParamsBase = OpenAI.Chat.Completions.ChatCompletionCreateParams & { id?: string };
interface TaskLoopOptions {
    maxEpochs: number;
}

/**
 * @description 对任务循环进行的抽象封装
 */
export class TaskLoop {
    private bridge = useMessageBridge();

    constructor(
        private readonly streamingContent: Ref<string>,
        private readonly streamingToolCalls: Ref<ToolCall[]>,
        private readonly messages: ChatMessage[],
        private readonly taskOptions: TaskLoopOptions = { maxEpochs: 20 },
        private readonly onError: (msg: string) => void = (msg) => {},
        private readonly onChunk: (chunk: ChatCompletionChunk) => void = (chunk) => {},
        private readonly onDone: () => void = () => {},
    ) {}

    private async handleToolCalls(toolCalls: ToolCall[]) {
        // TODO: 调用多个工具并返回调用结果？
        const toolCall = toolCalls[0];
        try {
            const toolName = toolCall.name;
            const toolArgs = JSON.parse(toolCall.arguments);
            const toolResponse = await callTool(toolName, toolArgs);
            if (!toolResponse.isError) {
                const content = JSON.stringify(toolResponse.content);
                return content;
            } else {
                this.onError(`工具调用失败: ${toolResponse.content}`);
            }

        } catch (error) {
            this.onError(`工具调用失败: ${(error as Error).message}`);
        }
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
            if (toolCall.index === 0) {
                // 新的工具调用开始
                this.streamingToolCalls.value = [{
                    id: toolCall.id,
                    name: toolCall.function?.name || '',
                    arguments: toolCall.function?.arguments || ''
                }];
            } else {
                // 累积现有工具调用的信息
                const currentCall = this.streamingToolCalls.value[toolCall.index];
                if (currentCall) {
                    if (toolCall.id) {
                        currentCall.id = toolCall.id;
                    }
                    if (toolCall.function?.name) {
                        currentCall.name = toolCall.function.name;
                    }
                    if (toolCall.function?.arguments) {
                        currentCall.arguments += toolCall.function.arguments;
                    }
                }
            }
        }
    }

    private doConversation(chatData: ChatCompletionCreateParamsBase) {

        const bridge = useMessageBridge();
        return new Promise<void>((resolve, reject) => {
            const chunkHandler = bridge.addCommandListener('llm/chat/completions/chunk', data => {
                if (data.code !== 200) {
                    this.onError(data.msg || '请求模型服务时发生错误');
                    reject(new Error(data.msg || '请求模型服务时发生错误'));
                    return;
                }
                const { chunk } = data.msg as { chunk: ChatCompletionChunk };
                
                // 处理增量的 content 和 tool_calls
                this.handleChunkDeltaContent(chunk);
                this.handleChunkDeltaToolCalls(chunk);
                
                this.onChunk(chunk);
            }, { once: false });
        
            bridge.addCommandListener('llm/chat/completions/done', data => {
                this.onDone();
                chunkHandler();

                resolve();
            }, { once: true });

            bridge.postMessage({
                command: 'llm/chat/completions',
                data: chatData
            });
        });
    }


    public makeChatData(tabStorage: ChatStorage): ChatCompletionCreateParamsBase {
        const baseURL = llms[llmManager.currentModelIndex].baseUrl;
        const apiKey = llms[llmManager.currentModelIndex].userToken;
        const model = llms[llmManager.currentModelIndex].userModel;
        const temperature = tabStorage.settings.temperature;
        const tools = getToolSchema(tabStorage.settings.enableTools);

        const userMessages = [];
        if (tabStorage.settings.systemPrompt) {
            userMessages.push({
                role: 'system',
                content: tabStorage.settings.systemPrompt
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


    /**
     * @description 开启循环，异步更新 DOM
     */
    public async start(tabStorage: ChatStorage) {
        // 后端接受属性 baseURL, apiKey, model, messages, temperature
        
        while (true) {
            // 初始累计清空
            this.streamingContent.value = '';
            this.streamingToolCalls.value = [];

            // 构造 chatData
            const chatData = this.makeChatData(tabStorage);

            // 发送请求
            await this.doConversation(chatData);

            // 如果存在需要调度的工具
            if (this.streamingToolCalls.value.length > 0) {
                const toolCallResult = await this.handleToolCalls(this.streamingToolCalls.value);
                if (toolCallResult) {
                    const toolCall = this.streamingToolCalls.value[0];

                    tabStorage.messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id || toolCall.name,
                        content: toolCallResult
                    });
                }
                
            } else if (this.streamingContent.value) {
                tabStorage.messages.push({
                    role: 'assistant',
                    content: this.streamingContent.value
                });
            }
        }
    }
}