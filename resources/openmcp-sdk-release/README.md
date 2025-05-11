<div align="center">

<img src="./icons/openmcp.png" height="200px"/>

<h3>OpenMCP: 一体化 MCP Server 调试器</h3>

<a href="https://qm.qq.com/cgi-bin/qm/qr?k=C6ZUTZvfqWoI12lWe7L93cWa1hUsuVT0&jump_from=webapi&authKey=McW6B1ogTPjPDrCyGttS890tMZGQ1KB3QLuG4aqVNRaYp4vlTSgf2c6dMcNjMuBD" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #CB81DA; color: white; border-radius: .5em; text-decoration: none;">👉 加入 OpenMCP正式级技术组</a>


<a href="https://discord.gg/af5cfB9a" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: rgb(84, 176, 84); color: white; border-radius: .5em; text-decoration: none;"> 加入 OpenMCP Discord频道</a>

</div>


## 安装

```bash
npm install openmcp-sdk
```

## 使用

文件名：main.ts

```typescript
import { TaskLoop } from 'openmcp-sdk/task-loop';
import { TaskLoopAdapter } from 'openmcp-sdk/service';

async function main() {
    // 创建适配器，负责通信和 mcp 连接
    const adapter = new TaskLoopAdapter();

    // 连接 mcp 服务器
    await adapter.connectMcpServer({
        connectionType: 'STDIO',
        command: 'node',
        args: [
            '~/projects/mcp/servers/src/puppeteer/dist/index.js'
        ]
    });

    // 获取工具列表
    const tools = await adapter.listTools();

    // 创建事件循环驱动器
    const taskLoop = new TaskLoop({ adapter });

    // 配置改次事件循环使用的大模型
    taskLoop.setLlmConfig({
        id: 'deepseek',
        baseUrl: 'https://api.deepseek.com/v1',
        userToken: process.env['DEEPSEEK_API_TOKEN'],
        userModel: 'deepseek-chat'
    });

    // 创建当前事件循环对应的上下文，并且配置当前上下文的设置
    const storage = {
        messages: [],
        settings: {
            temperature: 0.7,
            enableTools: tools,
            systemPrompt: 'you are a clever bot',
            contextLength: 20
        }
    };

    // 本次发出的问题
    const message = 'hello world';

    // 事件循环结束的句柄
    taskLoop.registerOnDone(() => {
        console.log('taskLoop done');
    });

    // 事件循环每一次 epoch 开始的句柄
    taskLoop.registerOnError((error) => {
        console.log('taskLoop error', error);
    });

    // 事件循环出现 error 时的句柄（出现 error 不一定会停止事件循环）
    taskLoop.registerOnEpoch(() => {
        console.log('taskLoop epoch');
    });

    // 开启事件循环
    await taskLoop.start(storage, message);

    // 打印上下文，最终的回答在 messages.at(-1) 中
    console.log(storage.messages);
}

main();
```

star 我们的项目：https://github.com/LSTM-Kirigaya/openmcp-client