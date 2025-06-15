import { PostMessageble } from "../hook/adapter.js";
import { OpenAI } from "openai";
import { MyMessageType, MyToolMessageType } from "./llm.dto.js";
import { RestfulResponse } from "../common/index.dto.js";
import { ocrDB } from "../hook/db.js";
import type { ToolCallContent } from "../mcp/client.dto.js";
import { ocrWorkerStorage } from "../mcp/ocr.service.js";
import Table from 'cli-table3';

export let currentStream: AsyncIterable<any> | null = null;

export async function streamingChatCompletion(
    data: any,
    webview: PostMessageble
) {
    const {
        baseURL,
        apiKey,
        model,
        messages,
        temperature,
        tools = [],
        parallelToolCalls = true,
        proxyServer = ''
    } = data;

    // 创建请求参数表格
    const requestTable = new Table({
        head: ['Parameter', 'Value'],
        colWidths: [20, 40],
        style: {
            head: ['cyan'],
            border: ['grey']
        }
    });
    

    // 构建OpenRouter特定的请求头
    const defaultHeaders: Record<string, string> = {};
    if (baseURL && baseURL.includes('openrouter.ai')) {
        defaultHeaders['HTTP-Referer'] = 'https://github.com/openmcp/openmcp-client';
        defaultHeaders['X-Title'] = 'OpenMCP Client';
    }

    const client = new OpenAI({
        baseURL,
        apiKey,
        defaultHeaders: Object.keys(defaultHeaders).length > 0 ? defaultHeaders : undefined
    });
    
    const seriableTools = (tools.length === 0) ? undefined: tools;
    const seriableParallelToolCalls = (tools.length === 0)? 
        undefined: model.startsWith('gemini') ? undefined : parallelToolCalls;
     
    await postProcessMessages(messages);

    // // 使用表格渲染请求参数
    // requestTable.push(
    //     ['Model', model],
    //     ['Base URL', baseURL || 'Default'],
    //     ['Temperature', temperature],
    //     ['Tools Count', tools.length],
    //     ['Parallel Tool Calls', parallelToolCalls],
    //     ['Proxy Server', proxyServer || 'No Proxy']
    // );
    
    // console.log('\nOpenAI Request Parameters:');
    // console.log(requestTable.toString());
    
    const stream = await client.chat.completions.create({
        model,
        messages,
        temperature,
        tools: seriableTools,
        parallel_tool_calls: seriableParallelToolCalls,
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

async function postProcessToolMessages(message: MyToolMessageType) {
	if (typeof message.content === 'string') {
		return;
	}

	for (const content of message.content) {
		const contentType = content.type as string;
		const rawContent = content as ToolCallContent;

		if (contentType === 'image') {			
			rawContent.type = 'text';
			
			// 此时图片只会存在三个状态
            // 1. 图片在 ocrDB 中
            // 2. 图片的 OCR 仍然在进行中
            // 3. 图片已被删除


            // rawContent.data 就是 filename
            const result = await ocrDB.findById(rawContent.data);
            if (result) {
                rawContent.text = result.text || '';            
            } else if (rawContent._meta) {
                const workerId = rawContent._meta.workerId;
                const worker = ocrWorkerStorage.get(workerId);
                if (worker) {
                    const text = await worker.fut;
                    rawContent.text = text;
                }
            } else {
                rawContent.text = '无效的图片';
            }

            delete rawContent._meta;
		}
	}

	message.content = JSON.stringify(message.content);
}

export async function postProcessMessages(messages: MyMessageType[]) {
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
				await postProcessToolMessages(message);
				break;
			default:
				break;
		}
	}
}