import { useMessageBridge } from "@/api/message-bridge";
import { llmManager, llms } from "@/views/setting/llm";
import { pinkLog } from "@/views/setting/util";
import I18n from '@/i18n/index';
import { userHasReadGuide } from "@/components/guide/tour";

export async function loadSetting() {
    const bridge = useMessageBridge();

    const data = await bridge.commandRequest('setting/load');
    if (data.code !== 200) {
        pinkLog('配置加载失败');
        console.log(data.msg);

    } else {
        const persistConfig = data.msg;
        pinkLog('配置加载成功');

        llmManager.currentModelIndex = persistConfig.MODEL_INDEX;
        I18n.global.locale.value = persistConfig.LANG;

        persistConfig.LLM_INFO.forEach((element: any) => {
            llms.push(element);
        });
    }
}

export async function getTour() {
    const bridge = useMessageBridge();
    const { code, msg } = await bridge.commandRequest('setting/get-tour');
    
    if (code === 200) {
        pinkLog('获取引导状态成功');
        userHasReadGuide.value = msg.userHasReadGuide || false;
    }
}

export async function setTour() {
    const bridge = useMessageBridge();
    const { code, msg } = await bridge.commandRequest('setting/set-tour', {
        userHasReadGuide: userHasReadGuide.value
    });
}

export function saveSetting(saveHandler?: () => void) {
    const bridge = useMessageBridge();

    const saveConfig = {
        MODEL_INDEX: llmManager.currentModelIndex,
        LLM_INFO: JSON.parse(JSON.stringify(llms)),
        LANG: I18n.global.locale.value
    };

    bridge.addCommandListener('setting/save', data => {
        const saveStatusCode = data.code;
        pinkLog('配置保存状态：' + saveStatusCode);

        if (saveHandler) {
            saveHandler();
        }
    }, { once: true });

    bridge.postMessage({
        command: 'setting/save',
        data: saveConfig
    });
}