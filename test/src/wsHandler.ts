// server/src/wsHandler.ts
import { WebSocketServer, WebSocket } from 'ws';
import { IMessage } from './types';

export class WSServer {
    private wss: WebSocketServer;
    private clients = new Set<WebSocket>();

    constructor(port: number) {
        this.wss = new WebSocketServer({ port });
        this.setupConnection();
    }

    private setupConnection() {
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log('Client connected');

            ws.on('message', (data) => {
                try {
                    const message: IMessage = JSON.parse(data.toString());
                    this.handleMessage(ws, message);
                } catch (err) {
                    console.error('Message parse error:', err);
                }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('Client disconnected');
            });
        });
    }

    private handleMessage(ws: WebSocket, message: IMessage) {
        console.log('Received:', message);

        // 模拟 VS Code 的 postMessage 响应
        if (message.type === 'client-message') {
            this.send(ws, {
                type: 'server-response',
                data: {
                    original: message.data,
                    response: 'Message received at ' + new Date().toISOString()
                }
            });
        }
    }

    public send(ws: WebSocket, message: IMessage) {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    public broadcast(message: IMessage) {
        this.clients.forEach(client => {
            this.send(client, message);
        });
    }
}