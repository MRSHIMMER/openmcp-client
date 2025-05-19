import { Controller, RequestClientType } from "../common";
import { RequestData } from "../common/index.dto";
import { PostMessageble } from "../hook/adapter";
import { getClient } from "../mcp/connect.service";
import { abortMessageService, streamingChatCompletion } from "./llm.service";

export class LlmController {

    @Controller('llm/chat/completions')
    async chatCompletion(data: RequestData, webview: PostMessageble) {
        let { tools = [] } = data;

        const client = getClient(data.clientId);

        if (tools.length > 0 && !client) {
            return {
                code: 501,
                msg:'mcp client 尚未连接'
            };
        }

        
        try {
            await streamingChatCompletion(data, webview);            
        } catch (error) {
            console.log('error' + error);
            
            webview.postMessage({
                command: 'llm/chat/completions/error',
                data: {
                    msg: error
                }
            });
        }


        return {
            code: -1,
            msg: 'terminate'
        };
    }

    @Controller('llm/chat/completions/abort')
    async abortChatCompletion(data: RequestData, webview: PostMessageble) {
        return abortMessageService(data, webview);
    }

}