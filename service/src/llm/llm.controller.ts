import { OpenAI } from "openai";
import { Controller } from "../common";
import { RequestData } from "../common/index.dto";
import { PostMessageble } from "../hook/adapter";
import { abortMessageService, streamingChatCompletion } from "./llm.service";

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


    @Controller('llm/models')
    async getModels(data: RequestData, webview: PostMessageble) {
        const {
            baseURL,
            apiKey,
        } = data;        
        
        const client = new OpenAI({ apiKey, baseURL });
        const models = await client.models.list();

        return {
            code: 200,
            msg: models.data
        }
    }
}