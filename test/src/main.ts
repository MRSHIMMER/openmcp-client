// server/wsServer.ts
import WebSocket from 'ws';
import { messageController } from './controller';
import { VSCodeWebViewLike } from './adapter';

export interface VSCodeMessage {
    command: string;
    data?: unknown;
    callbackId?: string;
}

export type MessageHandler = (message: VSCodeMessage) => void;
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {

    // 仿造 webview 进行统一接口访问
    const webview = new VSCodeWebViewLike(ws);

    // 先发送成功建立的消息
    webview.postMessage({
        command: 'hello',
        data: 'hello'
    });

    // 注册消息接受的管线
    webview.onDidReceiveMessage(message => {
        try {
            const { command, data } = message;
            messageController(command, data, webview);
        } catch (error) {
            console.log('backend, meet error during [message], ', error);
        }
    });
});