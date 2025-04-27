import { PostMessageble } from "../hook/adapter";
import { OpenAI } from "openai";
import { MyMessageType, MyToolMessageType } from "./llm.dto";
import { RestfulResponse } from "../common/index.dto";

export let currentStream: AsyncIterable<any> | null = null;

export async function streamingChatCompletion(
    data: any,
    webview: PostMessageble
) {
    let { baseURL, apiKey, model, messages, temperature, tools = [] } = data;

    const client = new OpenAI({
        baseURL,
        apiKey
    });

    if (tools.length === 0) {
        tools = undefined;
    }
    
    postProcessMessages(messages);

    const stream = await client.chat.completions.create({
        model,
        messages,
        temperature,
        tools,
        tool_choice: 'auto',
        web_search_options: {},
        stream: true
    });

    // 存储当前的流式传输对象
    currentStream = stream;

    // 流式传输结果
    for await (const chunk of stream) {
        if (!currentStream) {
            // 如果流被中止，则停止循环
            // TODO: 为每一个标签页设置不同的 currentStream 管理器
            stream.controller.abort();
            // 传输结束
            webview.postMessage({
                command: 'llm/chat/completions/done',
                data: {
                    code: 200,
                    msg: {
                        success: true,
                        stage: 'abort'
                    }
                }
            });
            break;
        }
        
        if (chunk.choices) {
            const chunkResult = {
                code: 200,
                msg: {
                    chunk
                }
            };

            webview.postMessage({
                command: 'llm/chat/completions/chunk',
                data: chunkResult
            });
        }
    }

    // 传输结束
    webview.postMessage({
        command: 'llm/chat/completions/done',
        data: {
            code: 200,
            msg: {
                success: true,
                stage: 'done'
            }
        }
    });
}


// 处理中止消息的函数
export function abortMessageService(data: any, webview: PostMessageble): RestfulResponse {
    if (currentStream) {
        // 标记流已中止
        currentStream = null;
    }

    return {
        code: 200,
        msg: {
            success: true
        }
    }
}

function postProcessToolMessages(message: MyToolMessageType) {
	if (typeof message.content === 'string') {
		return;
	}

	for (const content of message.content) {
		const contentType = content.type as string;
		const rawContent = content as any;

		if (contentType === 'image') {
			delete rawContent._meta;
			
			rawContent.type = 'text';
			
			// 从缓存中提取图像数据
			rawContent.text = '图片已被删除';
		}
	}

	message.content = JSON.stringify(message.content);
}

export function postProcessMessages(messages: MyMessageType[]) {
	for (const message of messages) {
		// 去除 extraInfo 属性
		delete message.extraInfo;

		switch (message.role) {
			case 'user':
				break;
			case 'assistant':
				break;
			
			case 'system':

				break;

			case 'tool':
				postProcessToolMessages(message);
				break;
			default:
				break;
		}
	}
}