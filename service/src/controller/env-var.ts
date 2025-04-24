import { PostMessageble } from "../adapter";
import { MCPClient } from "./connect";


export async function lookupEnvVarHandler(client: MCPClient | undefined, data: any, webview: PostMessageble) {
    try {
        const { keys } = data;

        const values = keys.map((key: string) => process.env[key] || '');
        
        webview.postMessage({
            command: 'lookup-env-var',
            data: {
                code: 200,
                msg: values
            }
        });
    } catch (error) {
        webview.postMessage({
            command: 'lookup-env-var',
            data: {
                code: 500,
                msg: `Failed to lookup env vars: ${(error as Error).message}`
            }
        });
    }
}