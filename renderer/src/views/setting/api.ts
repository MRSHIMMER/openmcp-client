import { ChatStorage } from '@/components/main-panel/chat/chat-box/chat';
import { TaskLoop } from '@/components/main-panel/chat/core/task-loop';
import { llmManager } from './llm';
import { reactive, ref } from 'vue';
import { makeUsageStatistic } from '@/components/main-panel/chat/core/usage';

export const llmSettingRef = ref<any>(null);

export const simpleTestResult = reactive<{
    done: boolean,
    start: boolean,
    error: any,
    tps: string | number | undefined
}>({
    done: false,
    start: false,
    error: '',
    tps: undefined
});

export async function makeSimpleTalk() {
    simpleTestResult.done = false;
    simpleTestResult.start = true;
    simpleTestResult.tps = undefined;

    // 使用最简单的 hello 来测试
    const testMessage = 'hello';

    const loop = new TaskLoop();

    const chatStorage: ChatStorage = {
        messages: [],
        settings: {
            temperature: 0.7,
            modelIndex: llmManager.currentModelIndex,
            systemPrompt: '',
            enableTools: [],
            enableWebSearch: false,
            contextLength: 5
        }
    };

    loop.setMaxEpochs(1);

    loop.registerOnDone(() => {        
        simpleTestResult.error = '';
        simpleTestResult.done = true;
        simpleTestResult.start = false;
    });

    loop.registerOnError(error => {
        const errorReason = error.msg;
        const errorText = JSON.stringify(errorReason);

        simpleTestResult.error = errorText;
        simpleTestResult.start = false;
    });

    const startTime = performance.now();
    await loop.start(chatStorage, testMessage);

    const costTime = (performance.now() - startTime!) / 1000;
    const message = chatStorage.messages.at(-1);
    console.log(chatStorage.messages);

    if (message?.extraInfo) {
        const usage = message.extraInfo.usage;
        if (usage?.prompt_tokens && usage.completion_tokens) {
            const total = usage?.prompt_tokens + usage?.completion_tokens;
            simpleTestResult.tps = (total / costTime).toFixed(2);
        }
    }
    
}