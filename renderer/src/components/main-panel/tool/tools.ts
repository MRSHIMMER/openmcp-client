import { useMessageBridge } from '@/api/message-bridge';
import { mcpSetting } from '@/hook/mcp';
import type { ToolsListResponse, ToolCallResponse, CasualRestAPI } from '@/hook/type';
import { mcpClientAdapter } from '@/views/connect/core';

export interface ToolStorage {
    currentToolName: string;
    lastToolCallResponse?: ToolCallResponse | string;
    formData: Record<string, any>;
}

/**
 * @description 根据工具名字和参数调取工具
 * @param toolName 
 * @param toolArgs 
 * @returns 
 */
export async function callTool(toolName: string, toolArgs: Record<string, any>) {

    mcpClientAdapter

    const bridge = useMessageBridge();
    const { msg } = await bridge.commandRequest<ToolCallResponse>('tools/call', {
        toolName,
        toolArgs: JSON.parse(JSON.stringify(toolArgs)),
        callToolOption: {
            timeout: mcpSetting.timeout * 1000
        }
    });

    return msg;
}