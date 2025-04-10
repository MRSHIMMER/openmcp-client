import { Ref } from "vue";
import { ToolCall, ChatMessage } from "./chat";
import { useMessageBridge } from "@/api/message-bridge";

export class TaskLoop {
    private bridge = useMessageBridge();

    constructor(
        private readonly streamingContent: Ref<string>,
        private readonly streamingToolCalls: Ref<ToolCall[]>,
        private readonly messages: ChatMessage[],
        private readonly onError: (msg: string) => void
    ) {
        if (!onError) {
            this.onError = (msg) => {
            }
        }
    }

    private handleToolCalls(toolCalls: ToolCall[]) {
        // 这里预留给调用方实现工具执行逻辑
        return Promise.resolve("工具执行结果");
    }

    private continueConversation(chatData: any) {
        return new Promise<void>((resolve, reject) => {
            const chunkHandler = this.bridge.addCommandListener('llm/chat/completions/chunk', data => {
                if (data.code !== 200) {
                    this.onError(data.msg || '请求模型服务时发生错误');

                    reject(new Error(data.msg));
                    return;
                }
                const { chunk } = data.msg;
                
                const content = chunk.choices[0]?.delta?.content || '';
                const toolCall = chunk.choices[0]?.delta?.tool_calls?.[0];
                
                if (content) {
                    this.streamingContent.value += content;
                }
                
                if (toolCall) {
                    if (toolCall.index === 0) {
                        this.streamingToolCalls.value = [{
                            id: toolCall.id,
                            name: toolCall.function?.name || '',
                            arguments: toolCall.function?.arguments || ''
                        }];
                    } else {
                        const currentCall = this.streamingToolCalls.value[toolCall.index];
                        if (currentCall) {
                            if (toolCall.id) currentCall.id = toolCall.id;
                            if (toolCall.function?.name) currentCall.name = toolCall.function.name;
                            if (toolCall.function?.arguments) currentCall.arguments += toolCall.function.arguments;
                        }
                    }
                }
            }, { once: false });

            this.bridge.addCommandListener('llm/chat/completions/done', async data => {
                if (data.code !== 200) {
                    this.onError(data.msg || '模型服务处理完成但返回错误');
                    reject(new Error(data.msg));
                    return;
                }

                if (this.streamingContent.value) {
                    this.messages.push({
                        role: 'assistant',
                        content: this.streamingContent.value
                    });
                    this.streamingContent.value = '';
                }

                if (this.streamingToolCalls.value.length > 0) {
                    try {
                        const toolResult = await this.handleToolCalls(this.streamingToolCalls.value);
                        
                        // 将工具执行结果添加到消息列表
                        this.streamingToolCalls.value.forEach(tool => {
                            if (tool.id) {
                                this.messages.push({
                                    role: 'tool',
                                    tool_call_id: tool.id,
                                    content: toolResult
                                });
                            }
                        });
                        
                        // 继续与模型对话
                        await this.continueConversation(chatData);
                    } catch (error) {
                        reject(error);
                        return;
                    } finally {
                        this.streamingToolCalls.value = [];
                    }
                }

                chunkHandler();
                resolve();
            }, { once: true });

            this.bridge.postMessage({
                command: 'llm/chat/completions',
                data: chatData
            });
        });
    }

    public async start(chatData: any) {
        this.streamingContent.value = '';
        this.streamingToolCalls.value = [];
        
        try {
            await this.continueConversation(chatData);
        } catch (error) {
            this.onError(error instanceof Error ? error.message : '未知错误');
        }
    }


    // bridge api
    public async name() {
        
    }
}