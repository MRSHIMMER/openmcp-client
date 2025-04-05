import { useMessageBridge } from "@/api/message-bridge";


export function loadSetting() {
    const bridge = useMessageBridge();
    bridge.addCommandListener('setting/load', () => {
        
    }, { once: true });  
}

export function saveSetting() {
    const bridge = useMessageBridge();

}