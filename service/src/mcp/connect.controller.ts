import { Controller } from '../common';
import { PostMessageble } from '../hook/adapter';
import { RequestData } from '../common/index.dto';
import { connectService, getClient } from './connect.service';

export class ConnectController {

	@Controller('connect')
    async connect(data: any, webview: PostMessageble) {
        const res = await connectService(data, webview);
        return res;
    }

    @Controller('lookup-env-var')
    async lookupEnvVar(data: RequestData, webview: PostMessageble) {
        const { keys } = data;
        const values = keys.map((key: string) => {
            // TODO: 在 Windows 上测试
            if (process.platform === 'win32' && key.toLowerCase() === 'path') {
                key = 'Path'; // 确保正确匹配环境变量的 ke
            }

            return process.env[key] || '';
        });

        return {
            code: 200,
            msg: values
        }
    }

    @Controller('ping')
    async ping(data: RequestData, webview: PostMessageble) {
        const client = getClient(data.clientId);
        if (!client) {
            const connectResult = {
                code: 501,
                msg:'mcp client 尚未连接'
            };
            return connectResult;
        }

        return {
            code: 200,
            msg: {}
        }
    }
}