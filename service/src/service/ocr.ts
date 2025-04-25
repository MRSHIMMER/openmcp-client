import { PostMessageble } from "../hook/adapter";
import { MCPClient } from "../hook/client";

export function ocrService(
	client: MCPClient | undefined,
	data: any,
	webview: PostMessageble
) {
	

	webview.postMessage({
		command: 'ping',
		data: {
			code: 200,
			msg: {}
		}
	});
}