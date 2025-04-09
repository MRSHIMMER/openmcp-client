import { ToolItem } from "@/hook/type";
import { ref } from "vue";

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// 新增状态和工具数据
interface EnableToolItem {
	name: string;
	description: string;
	enabled: boolean;
}

export interface ChatSetting {
    modelIndex: number
    systemPrompt: string
    enableTools: EnableToolItem[]
    temperature: number
    enableWebSearch: boolean
    contextLength: number
}

export interface ChatStorage {
	messages: ChatMessage[]
    settings: ChatSetting
}

export const allTools = ref<ToolItem[]>([]);

export function getToolSchema(enableTools: EnableToolItem[]) {
    const toolsSchema = [];
	for (let i = 0; i < enableTools.length; i++) {
		if (enableTools[i].enabled) {
			const tool = allTools.value[i];
			
			toolsSchema.push({
				name: tool.name,
				description: tool.description || "",
				parameters: {
					type: "function",
					properties: tool.inputSchema.properties,
					required: tool.inputSchema.required
				}
			});
		}
	}
    return toolsSchema;
}