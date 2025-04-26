import { ChatMessage, ToolMessage } from "./chat";

const OPENAI_SUPPORT_MEDIA = new Set(['text', 'image_url', 'video_url']);

function hasInvalidType(toolMessage: ToolMessage) {
    for (const content of toolMessage.content) {
        if (OPENAI_SUPPORT_MEDIA.has(content.type)) {
            continue;
        }
        return true;
    }
    return false;
}

function normaliseToolMessage(rest: ToolMessage) {
    if (!hasInvalidType(rest)) {
        return rest;
    }

    const newRest = JSON.parse(JSON.stringify(rest));

    // 过滤一下 userMessages，现在的大部分模型只支持 text, image_url and video_url 这三种类型的数据
    for (const content of newRest.content) {
        if (OPENAI_SUPPORT_MEDIA.has(content.type)) {
            continue;
        }
        
        

    }

    return rest;
}

/**
 * @description 标准化发送信息，将自定义的项目进行剔除
 * 对于图像信息进行特殊处理
 * @param userMessages 
 */
export async function normaliseChatMessage(userMessages: ChatMessage[]) {
    const normalisedMessages = [];
    for (const msg of userMessages) {
        if (msg.role === 'tool') {
            const normMessage = normaliseToolMessage(msg);
            const { extraInfo, name, ...rest } = normMessage;
            normalisedMessages.push(rest);
        } else {
            const { extraInfo, name, ...rest } = msg;
            normalisedMessages.push(rest);
        }
    }

    return normalisedMessages;
}