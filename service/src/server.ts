import { WebSocketServer } from 'ws';
import pino from 'pino';

import { routeMessage } from './common/router';
import { VSCodeWebViewLike } from './hook/adapter';
import path from 'node:path';
import * as fs from 'node:fs';
import { setRunningCWD } from './hook/setting';
import { exit } from 'node:process';

export interface VSCodeMessage {
    command: string;
    data?: unknown;
    callbackId?: string;
}

const logger = pino({
    transport: {
        target: 'pino-pretty', // 启用 pino-pretty
        options: {
            colorize: true,      // 开启颜色
            levelFirst: true,    // 先打印日志级别
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss', // 格式化时间
            ignore: 'pid,hostname',     // 忽略部分字段
        }
    }
});

export type MessageHandler = (message: VSCodeMessage) => void;

function refreshConnectionOption(envPath: string) {
    const serverPath = path.join(__dirname, '..', '..', 'servers');

    const defaultOption = {
        connectionType: 'STDIO',
        commandString: 'mcp run main.py',
        cwd: serverPath
    };

    fs.writeFileSync(envPath, JSON.stringify(defaultOption, null, 4));

    return { data: [defaultOption] };
}

function acquireConnectionOption() {
    const envPath = path.join(__dirname, '..', '.env');

    if (!fs.existsSync(envPath)) {
        return refreshConnectionOption(envPath);
    }

    try {
        const option = JSON.parse(fs.readFileSync(envPath, 'utf-8'));

        if (!option.data) {
            return refreshConnectionOption(envPath);
        }

        if (option.data && option.data.length === 0) {
            return refreshConnectionOption(envPath);
        }

        // 按照前端的规范，整理成 commandString 样式
        option.data = option.data.map((item: any) => {
            if (item.connectionType === 'STDIO') {
                item.commandString = [item.command, ...item.args]?.join(' ');
            } else {
                item.url = item.url;
            }

            return item;
        });

        return option;

    } catch (error) {
        logger.error('读取 .env 配置文件');
        return refreshConnectionOption(envPath);
    }
}

if (!fs.existsSync(path.join(__dirname, '..', '.env.website.local'))) {
    console.log('.env.website.local 不存在！');
    exit(0);
}

const authPassword = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.env.website.local'), 'utf-8')).password;

function updateConnectionOption(data: any) {
    const envPath = path.join(__dirname, '..', '.env');
    const connection = { data };
    fs.writeFileSync(envPath, JSON.stringify(connection, null, 4));
}

const devHome = path.join(__dirname, '..', '..');
setRunningCWD(devHome);

function verifyToken(url: string) {
    try {
        const token = url.split('=')[1];
        return token === authPassword.toString();
    } catch (error) {
        return false;
    }
}

const wss = new WebSocketServer(
    {
        port: 8282,
        verifyClient: (info, callback) => {
            console.log(info.req.url);
            const ok = verifyToken(info.req.url || '');

            if (!ok) {
                callback(false, 401, 'Unauthorized: Invalid token');
            } else {
                callback(true); // 允许连接
            }
        }
    },
);

console.log('listen on ws://localhost:8282');

wss.on('connection', (ws: any) => {

    // 仿造 webview 进行统一接口访问
    const webview = new VSCodeWebViewLike(ws);

    // 先发送成功建立的消息
    webview.postMessage({
        command: 'hello',
        data: {
            version: '0.0.1',
            name: '消息桥连接完成'
        }
    });

    const option = acquireConnectionOption();

    // 注册消息接受的管线
    webview.onDidReceiveMessage(message => {
        logger.info(`command: [${message.command || 'No Command'}]`);
        const { command, data } = message;

        switch (command) {
            case 'web/launch-signature':
                const launchResult = {
                    code: 200,
                    msg: option.data
                };

                webview.postMessage({
                    command: 'web/launch-signature',
                    data: launchResult
                });

                break;

            case 'web/update-connection-signature':
                updateConnectionOption(data);
                break;

            default:
                routeMessage(command, data, webview);
                break;
        }
    });
});