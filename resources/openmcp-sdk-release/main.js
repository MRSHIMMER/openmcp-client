const { TaskLoop } = require('../../openmcp-sdk/task-loop');
const { TaskLoopAdapter } = require('../../openmcp-sdk/service');

async function main() {
    // 创建适配器，负责通信和 mcp 连接
    const adapter = new TaskLoopAdapter();

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
            enableTools: [],
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

    const content = storage.messages.at(-1).content;
    console.log(content);
    
} 

main();
