import { ToolCallResponse } from "@/hook/type";
import { callTool } from "../../tool/tools";
import { MessageState, ToolCall } from "../chat-box/chat";

export async function handleToolCalls(toolCall: ToolCall) {
    // 反序列化 streaming 来的参数字符串
    const toolName = toolCall.function.name;
    const argsResult = deserializeToolCallResponse(toolCall.function.arguments);
    
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
    const toolResponse = await callTool(toolName, toolArgs);
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
        // 如果是 string，说明是错误信息
        console.log(toolResponse);


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