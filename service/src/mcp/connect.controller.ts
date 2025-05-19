import { Controller } from '../common';
import { PostMessageble } from '../hook/adapter';
import { RequestData } from '../common/index.dto';
import { connectService, getClient } from './connect.service';

export class ConnectController {

	@Controller('connect')
    async connect(data: any, webview: PostMessageble) {
        const res = await connectService(data);
        return res;
    }

    @Controller('lookup-env-var')
    async lookupEnvVar(data: RequestData, webview: PostMessageble) {
        const client = getClient(data.clientId);
        const { keys } = data;
        const values = keys.map((key: string) => process.env[key] || '');

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