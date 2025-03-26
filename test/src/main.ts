// server/src/server.ts
import express from 'express';
import { WSServer } from './wsHandler';

const app = express();
const PORT = 3000;

// 初始化 WebSocket 服务器
const wsServer = new WSServer(8080);

// HTTP 接口
app.get('/', (req, res) => {
    res.send('WebSocket Server is running');
});

// 启动 HTTP 服务器
app.listen(PORT, () => {
    console.log(`HTTP server running on port ${PORT}`);
});