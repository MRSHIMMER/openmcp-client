import {  RequestClientType } from "../common/index.dto.js";
import { Controller } from "../common/index.js";
import { RequestData } from "../common/index.dto.js";
import { PostMessageble } from "../hook/adapter.js";
import { getClient } from "../mcp/connect.service.js";
import { abortMessageService, streamingChatCompletion } from "./llm.service.js";

export class LlmController {

    @Controller('llm/chat/completions')
    async chatCompletion(data: RequestData, webview: PostMessageble) {

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