import { PostMessageble } from "../hook/adapter";
import { MCPClient } from "../hook/client";

export function ping(client: MCPClient | undefined, webview: PostMessageble) {
	if (!client) {
		const connectResult = {
			code: 501,
			msg: 'mcp client 尚未连接'
		};
		webview.postMessage({ command: 'ping', data: connectResult });
		return;
	}

	webview.postMessage({
		command: 'ping', data: {
			code: 200,
			msg: {}
		}
	});
}