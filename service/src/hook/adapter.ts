import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { routeMessage } from '../common/router.js';
import { McpOptions } from '../mcp/client.dto.js';
import { clientMap, connectService } from '../mcp/connect.service.js';

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
    private connectionOptions: McpOptions[] = [];

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
    public addMcp(mcpOption: McpOptions) {

        // 0.1.4 新版本开始，此处修改为懒加载连接
        // 实际的连接移交给前端 mcpAdapter 中进行统一的调度
        // 调度步骤如下：
        // getLaunchSignature 先获取访问签名，访问签名通过当前函数 push 到 class 中

        this.connectionOptions.push(mcpOption);
    }
}

