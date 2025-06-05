import type { ToolCallContent, ToolCallResponse } from "@/hook/type";
import { MessageState, type ToolCall } from "../chat-box/chat";
import { mcpClientAdapter } from "@/views/connect/core";
import type { BasicLlmDescription } from "@/views/setting/llm";
import { redLog } from "@/views/setting/util";

export interface ToolCallResult {
    state: MessageState;
    content: ToolCallContent[];
}

export type IToolCallIndex = number;

export async function handleToolCalls(toolCall: ToolCall): Promise<ToolCallResult> {

    if (!toolCall.function) {
        return {
            content: [{
                type: 'error',
                text: 'no tool function'
            }],
            state: MessageState.NoToolFunction
        }
    }

    // 反序列化 streaming 来的参数字符串
    // TODO: check as string
    const toolName = toolCall.function.name as string;
    const argsResult = deserializeToolCallResponse(toolCall.function.arguments as string);
    
    if (argsResult.error) {
        return {
            content: [{
                type: 'error',
                text: parseErrorObject(argsResult.error)
            }],
            state: MessageState.ParseJsonError
        };
    }

    const toolArgs = argsResult.value;

    // 进行调用，根据结果返回不同的值
    const toolResponse = await mcpClientAdapter.callTool(toolName, toolArgs);
    return handleToolResponse(toolResponse);
}

function deserializeToolCallResponse(toolArgs: string) {
    try {
        const args = JSON.parse(toolArgs);
        return {
            value: args,
            error: undefined
        }
    } catch (error) {
        return {
            value: undefined,
            error
        }
    }
}

function handleToolResponse(toolResponse: ToolCallResponse) {
    if (typeof toolResponse === 'string') {

        return {
            content: [{
                type: 'error',
                text: toolResponse
            }],
            state: MessageState.ToolCall
        }

    } else if (!toolResponse.isError) {

        return {
            content: toolResponse.content,
            state: MessageState.Success
        };

    } else {

        return {
            content: toolResponse.content,
            state: MessageState.ToolCall
        };

    }
}

function parseErrorObject(error: any): string {
    if (typeof error === 'string') {
        return error;
    } else if (typeof error === 'object') {
        return JSON.stringify(error, null, 2);
    } else {
        return error.toString();
    }
}

function grokIndexAdapter(toolCall: ToolCall, callId2Index: Map<string, number>): IToolCallIndex {
    // grok 采用 id 作为 index，需要将 id 映射到 zero-based 的 index
    if (!toolCall.id) {
        return 0;
    }
    if (!callId2Index.has(toolCall.id)) {
        callId2Index.set(toolCall.id, callId2Index.size);
    }
    return callId2Index.get(toolCall.id)!;
}

function geminiIndexAdapter(toolCall: ToolCall): IToolCallIndex {
    // TODO: 等待后续支持
    return 0;
}

function defaultIndexAdapter(toolCall: ToolCall): IToolCallIndex {
    return toolCall.index || 0;
}

export function getToolCallIndexAdapter(llm: BasicLlmDescription) {

    if (llm.userModel.startsWith('gemini')) {
        return geminiIndexAdapter;
    }

    if (llm.userModel.startsWith('grok')) {
        const callId2Index = new Map<string, number>();
        return (toolCall: ToolCall) => grokIndexAdapter(toolCall, callId2Index);
    }

    return defaultIndexAdapter;
}