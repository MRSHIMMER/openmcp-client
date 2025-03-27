// server/wsServer.ts
import WebSocket from 'ws';

export interface VSCodeMessage {
    command: string;
    payload?: unknown;
    callbackId?: string;
}

export type MessageHandler = (message: VSCodeMessage) => void;

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    // 转换普通消息为 VS Code 格式
    ws.on('message', (data) => {
        console.log('receive data from frontend: ' + data.toString());
        
        // const rawMessage = data.toString();
        // const vscodeMessage: VSCodeMessage = {
        //     command: 'ws-message',
        //     payload: rawMessage,
        //     callbackId: Math.random().toString(36).slice(2)
        // };
        // ws.send(JSON.stringify(vscodeMessage));
    });

    // 连接后发送一个消息
    const vscodeMessage: VSCodeMessage = {
        command: 'ws-message',
        payload: {
            text: 'connection completed'
        },
        callbackId: Math.random().toString(36).slice(2)
    };
    ws.send(JSON.stringify(vscodeMessage));
});