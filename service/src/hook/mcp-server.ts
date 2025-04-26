import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { diskStorage } from './db';

export function saveBase64ImageData(
    base64String: string,
    mimeType: string
): string {

    // 从 base64 字符串中提取数据部分
    const base64Data = base64String.replace(/^data:.+;base64,/, '');

    // 生成唯一文件名
    const fileName = `${uuidv4()}.${mimeType.split('/')[1]}`;

    diskStorage.setSync(fileName, base64Data, { encoding: 'base64' });

    return fileName;
}

export function loadBase64ImageData(fileName: string): string {
    const homedir = os.homedir();
    const imageStorageFolder = path.join(homedir, '.openmcp','storage');
    const filePath = path.join(imageStorageFolder, fileName);
    // 读取文件内容
    if (!fs.existsSync(filePath)) {
        return '';
    }

    const fileContent = fs.readFileSync(filePath, { encoding: 'base64' });
    // 构建 base64 字符串
    const base64String = `data:image/png;base64,${fileContent}`;
    return base64String;
}

interface ToolCallContent {
    type: string;
    text?: string;
    data?: any;
    mimeType?: string;
    _meta?: any;
    [key: string]: any;
}

interface ToolCallResponse {
    _meta?: any;
    content?: ToolCallContent[];
    isError?: boolean;
    toolResult?: any;
}

export function postProcessToolcallResponse(response: ToolCallResponse): ToolCallResponse {
    if (response.isError) {
        // 如果是错误响应，将其转换为错误信息
        return response;
    }

    // 将 content 中的图像 base64 提取出来，并保存到本地
    if (response.content) {
        response.content.forEach((content) => {
            if (content.type === 'image') {
                // TODO: check here
                if (content.data && content.mimeType) {
                    const fileName = saveBase64ImageData(content.data, content.mimeType);
                    content.data = fileName;
                    content._meta = {
                        ocr: true
                    };
                }
            }
        })
    }

    return response;
}