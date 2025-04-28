import { useMessageBridge } from "@/api/message-bridge";
import { ref } from "vue";

interface SystemPrompt {
    name: string;
    content: string;
}

export const systemPrompt = ref<SystemPrompt>({
    name: '默认',
    content: '你是一个AI助手, 你可以回答任何问题。'
});

export function saveSystemPrompts() {
    const bridge = useMessageBridge();
    return new Promise(resolve => {
        
    })
}