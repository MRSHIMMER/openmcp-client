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
            console.log(key);
            console.log(process.env);
            
            if (process.platform === 'win32') {
                switch (key) {
                    case 'USER':
                        return process.env.USERNAME || '';
                    case 'HOME':
                        return process.env.USERPROFILE || process.env.HOME;
                    case 'LOGNAME':
                        return process.env.USERNAME || '';
                    case 'SHELL':
                        return process.env.SHELL || process.env.COMSPEC;
                    case 'TERM':
                        return process.env.TERM || '未设置 (Windows 默认终端)';
                }
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