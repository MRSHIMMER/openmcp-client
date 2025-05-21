import type { ToolCallResponse } from '@/hook/type';

export interface ToolStorage {
    activeNames: any[];
    currentToolName: string;
    lastToolCallResponse?: ToolCallResponse | string;
    formData: Record<string, any>;
}
