import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { routeMessage } from '../common/router';
import { McpOptions } from '../mcp/client.dto';
import { client, connectService } from '../mcp/connect.service';

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

    constructor(option?: any) {
        this.emitter = new EventEmitter(option);
        this.messageHandlers = new Set();

        this.emitter.on('message/renderer', (message: WebSocketMessage) => {
            this.messageHandlers.forEach((handler) => handler(message));
        });

        // 默认需要将监听的消息导入到 routeMessage 中
        this.onDidReceiveMessage((message) => {
            const { command, data } = message;        
            routeMessage(command, data, this);
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
    public async connectMcpServer(mcpOption: McpOptions) {
        const res = await connectService(undefined, mcpOption);
        if (res.code === 200) {
            console.log('✅ 成功连接 mcp 服务器： '  + res.msg);
            const version = client?.getServerVersion();
            console.log(version);
        } else {
            console.error('❌ 连接 mcp 服务器失败：' + res.msg);
        }
    }

    /**
     * @description 获取 mcp 服务器的工具列表
     * @returns 
     */
    public async listTools() {
        const tools = await client?.listTools();
        if (tools?.tools) {
            return tools.tools.map((tool) => {
                const enabledTools = { ...tool, enabled: true };
                return enabledTools;
            });
        }
        return [];
    }
}

