import * as fs from 'fs';

import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { routeMessage } from '../common/router.js';
import { ConnectionType } from '../mcp/client.dto.js';

// WebSocket 消息格式
export interface WebSocketMessage {
    command: string;
    data: any;
}

// 服务器返回的消息格式
export interface WebSocketResponse {
    result?: any;
    timeCost?: number;
    error?: string;
}

export interface PostMessageble {
    postMessage(message: any): void;
}

export interface IConnectionArgs {
    connectionType: ConnectionType;
    commandString?: string;
    cwd?: string;
    url?: string;
    oauth?: string;
    env?: {
        [key: string]: string;
    };
    [key: string]: any;
}

// 监听器回调类型
export type MessageHandler = (message: any) => void;

export class VSCodeWebViewLike {
    private ws: WebSocket;
    private messageHandlers: Set<MessageHandler>;

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.messageHandlers = new Set();

        // 监听消息并触发回调
        this.ws.on('message', (rawData: Buffer | string) => {
            try {
                const message: any = JSON.parse(rawData.toString());
                this.messageHandlers.forEach((handler) => handler(message));
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        });
    }

    /**
     * 发送消息（模拟 vscode.webview.postMessage）
     * @param message - 包含 command 和 args 的消息
     */
    postMessage(message: WebSocketMessage): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open, cannot send message');
        }
    }

    /**
     * 接收消息（模拟 vscode.webview.onDidReceiveMessage）
     * @param callback - 消息回调
     * @returns {{ dispose: () => void }} - 可销毁的监听器
     */
    onDidReceiveMessage(callback: MessageHandler): { dispose: () => void } {
        this.messageHandlers.add(callback);
        return {
            dispose: () => this.messageHandlers.delete(callback),
        };
    }
}


export class TaskLoopAdapter {
    public emitter: EventEmitter;
    private messageHandlers: Set<MessageHandler>;
    private connectionOptions: IConnectionArgs[] = [];

    constructor(option?: any) {
        this.emitter = new EventEmitter(option);
        this.messageHandlers = new Set();

        this.emitter.on('message/renderer', (message: WebSocketMessage) => {
            this.messageHandlers.forEach((handler) => handler(message));
        });

        // 默认需要将监听的消息导入到 routeMessage 中
        this.onDidReceiveMessage((message) => {
            const { command, data } = message;

            switch (command) {
                case 'nodejs/launch-signature':
                    this.postMessage({
                        command: 'nodejs/launch-signature',
                        data: {
                            code: 200,
                            msg: this.connectionOptions
                        }
                    })
                    break;

                case 'nodejs/update-connection-signature':
                    // sdk 模式下不需要自动保存连接参数
                    break;

                default:
                    routeMessage(command, data, this);
                    break;
            }
        });

    }

    /**
     * @description 发送消息
     * @param message - 包含 command 和 args 的消息
     */
    public postMessage(message: WebSocketMessage): void {
        this.emitter.emit('message/service', message);
    }

    /**
     * @description 注册接受消息的句柄
     * @param callback - 消息回调
     * @returns {{ dispose: () => void }} - 可销毁的监听器
     */
    public onDidReceiveMessage(callback: MessageHandler): { dispose: () => void } {
        this.messageHandlers.add(callback);
        return {
            dispose: () => this.messageHandlers.delete(callback),
        };
    }

    /**
     * @description 连接到 mcp 服务端
     * @param mcpOption 
     */
    public addMcp(mcpOption: IConnectionArgs) {

        // 0.1.4 新版本开始，此处修改为懒加载连接
        // 实际的连接移交给前端 mcpAdapter 中进行统一的调度
        // 调度步骤如下：
        // getLaunchSignature 先获取访问签名，访问签名通过当前函数 push 到 class 中

        this.connectionOptions.push(mcpOption);
    }
}

interface StdioMCPConfig {
    command: string;
    args: string[];
    env?: {
        [key: string]: string;
    };
    description?: string;
    prompt?: string;
}

interface HttpMCPConfig {
    url: string;
    type?: string;
    env?: {
        [key: string]: string;
    };
    description?: string;
    prompt?: string;
}

export interface OmAgentConfiguration {
    version: string;
    mcpServers: {
        [key: string]: StdioMCPConfig | HttpMCPConfig;
    };
    defaultLLM: {
        baseURL: string;
        apiToken: string;
        model: string;
    }
}

export interface DefaultLLM {
    baseURL: string;
    apiToken?: string;
    model: string;
}

import { MessageState, TaskLoopOptions, type ChatMessage, type ChatSetting, type TaskLoop, type TextMessage } from '../../task-loop.js';

export function UserMessage(content: string): TextMessage {
    return {
        role: 'user',
        content,
        extraInfo: {
            created: Date.now(),
            state: MessageState.None,
            serverName: '',
            enableXmlWrapper: false
        }
    }
}

export function AssistantMessage(content: string): TextMessage {
    return {
        role: 'assistant',
        content,
        extraInfo: {
            created: Date.now(),
            state: MessageState.None,
            serverName: '',
            enableXmlWrapper: false
        }
    }
}

export class OmAgent {
    private _adapter: TaskLoopAdapter;
    private _loop?: TaskLoop;
    private _defaultLLM?: DefaultLLM;

    constructor() {
        this._adapter = new TaskLoopAdapter();
    }

    /**
     * @description Load MCP configuration from file.
     * Supports multiple MCP backends and a default LLM model configuration.
     *
     * @example
     * Example configuration:
     * {
     *   "version": "1.0.0",
     *   "mcpServers": {
     *     "openmemory": {
     *       "command": "npx",
     *       "args": ["-y", "openmemory"],
     *       "env": {
     *         "OPENMEMORY_API_KEY": "YOUR_API_KEY",
     *         "CLIENT_NAME": "openmemory"
     *       },
     *       "description": "A MCP for long-term memory support",
     *       "prompt": "You are a helpful assistant."
     *     }
     *   },
     *   "defaultLLM": {
     *     "baseURL": "https://api.openmemory.ai",
     *     "apiToken": "YOUR_API_KEY",
     *     "model": "deepseek-chat"
     *   }
     * }
     *
     * @param configPath - Path to the configuration file
     */
    public loadMcpConfig(configPath: string) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as OmAgentConfiguration;
        const { mcpServers, defaultLLM } = config;

        // set default llm
        this.setDefaultLLM(defaultLLM);

        for (const key in mcpServers) {
            const mcpConfig = mcpServers[key];
            if ('command' in mcpConfig) {
                const commandString = (
                    mcpConfig.command + ' ' + mcpConfig.args.join(' ')
                ).trim();
                
                this._adapter.addMcp({
                    commandString,
                    connectionType: 'STDIO',
                    env: mcpConfig.env,
                    description: mcpConfig.description,
                    prompt: mcpConfig.prompt,
                });
            } else {
                const connectionType: ConnectionType = mcpConfig.type === 'http' ? 'STREAMABLE_HTTP': 'SSE';
                this._adapter.addMcp({
                    url: mcpConfig.url,
                    env: mcpConfig.env,
                    connectionType,
                    description: mcpConfig.description,
                    prompt: mcpConfig.prompt,
                });
            }
        }
    }

    private async getLoop(loopOption?: TaskLoopOptions) {
        if (this._loop) {
            return this._loop;
        }

        const {
            verbose = 1,
            maxEpochs = 50,
            maxJsonParseRetry = 3,
        } = loopOption || {}

        const adapter = this._adapter;
        const { TaskLoop } = await import('../../task-loop.js');
        this._loop = new TaskLoop({ adapter, verbose, maxEpochs, maxJsonParseRetry });
        return this._loop;
    }

    public setDefaultLLM(option: DefaultLLM) {
        this._defaultLLM = option;
    }

    public async start(
        messages: ChatMessage[] | string,
        settings?: ChatSetting & Partial<TaskLoopOptions>
    ) {
        if (messages.length === 0) {
            throw new Error('messages is empty');
        }

        // detach taskloop option from settings and set default value
        const {
            maxEpochs = 50,
            maxJsonParseRetry = 3,
            verbose = 1
        } = settings || {};

        const loop = await this.getLoop({ maxEpochs, maxJsonParseRetry, verbose });
        const storage = await loop.createStorage(settings);
        
        // set input message
        // user can invoke [UserMessage("CONTENT")] to make messages quickly
        // or use string directly
        let userMessage: string;
        if (typeof messages === 'string') {
            userMessage = messages;
        } else {
            const lastMessageContent = messages.at(-1)?.content;
            if (typeof lastMessageContent === 'string') {
                userMessage = lastMessageContent;
            } else {
                throw new Error('last message content is undefined');
            }
        }

        // select correct llm config
        // user can set llm config via omagent.setDefaultLLM()
        // or write "defaultLLM" in mcpconfig.json to specify
        if (this._defaultLLM) {
            loop.setLlmConfig({
                baseUrl: this._defaultLLM.baseURL,
                userToken: this._defaultLLM.apiToken,
                userModel: this._defaultLLM.model,
            });
        } else {
            // throw error to user and give the suggestion
            throw new Error('default LLM is not set, please set it via omagent.setDefaultLLM() or write "defaultLLM" in mcpconfig.json');
        }

        return await loop.start(storage, userMessage);
    }
}
