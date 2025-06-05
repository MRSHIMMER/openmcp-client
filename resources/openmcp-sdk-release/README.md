<div align="center">

<img src="./icons/openmcp-sdk.svg" height="200px"/>

<h3>openmcp-sdk : 适用于 openmcp 的部署框架</h3>
<h4>闪电般将您的 agent 从实验室部署到生产环境</h4>

<a href="https://kirigaya.cn/openmcp" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #7D3FF8; color: white; border-radius: .5em; text-decoration: none;">📄 OpenMCP 官方文档</a>


<a href="https://qm.qq.com/cgi-bin/qm/qr?k=C6ZUTZvfqWoI12lWe7L93cWa1hUsuVT0&jump_from=webapi&authKey=McW6B1ogTPjPDrCyGttS890tMZGQ1KB3QLuG4aqVNRaYp4vlTSgf2c6dMcNjMuBD" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #CB81DA; color: white; border-radius: .5em; text-decoration: none;">QQ 讨论群</a><a href="https://discord.gg/af5cfB9a" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: rgb(84, 176, 84); color: white; border-radius: .5em; text-decoration: none; margin-left: 5px;">Discord频道</a>

</div>


## 安装

```bash
npm install openmcp-sdk
```

> 目前 openmcp-sdk 只支持 esm 模式的导入

## 使用

文件名：main.ts

```typescript
import { TaskLoop } from 'openmcp-sdk/task-loop';
import { TaskLoopAdapter } from 'openmcp-sdk/service';
async function main() {
    // 创建适配器，负责通信和 mcp 连接
    const adapter = new TaskLoopAdapter();

    // 添加 mcp 服务器
    adapter.addMcp({
        connectionType: 'STDIO',
        commandString: 'uv run mcp run main.py',
        cwd: '~/projects/openmcp-tutorial/crawl4ai-mcp'
    });

    adapter.addMcp({
        connectionType: 'STDIO',
        commandString: 'node index.js',
        cwd: '~/projects/openmcp-tutorial/my-browser/dist'
    });

    // 创建事件循环驱动器
    const taskLoop = new TaskLoop({ adapter });

    // 获取所有工具
    const tools = await taskLoop.getTools();

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
            // 在本次对话使用所有工具
            enableTools: tools,
            // 系统提示词
            systemPrompt: 'you are a clever bot',
            // 对话上下文的轮数
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

    // 每一次工具调用前
    taskLoop.registerOnToolCall((toolCall) => {
        return toolCall;
    });

    // 每一次工具调用完后的结果
    taskLoop.registerOnToolCalled((result) => {
        return result;
    });

    // 开启事件循环
    await taskLoop.start(storage, message);

    // 打印上下文，最终的回答在 messages.at(-1) 中
    const content = storage.messages.at(-1).content;
    console.log('最终回答：', content);
} 

main();
```

更多使用请看官方文档：https://kirigaya.cn/openmcp/sdk-tutorial/

star 我们的项目：https://github.com/LSTM-Kirigaya/openmcp-client