
import { VSCodeWebViewLike } from '../adapter';
import { connect, type MCPOptions } from './connect';

async function connectHandler(option: MCPOptions, webview: VSCodeWebViewLike) {
	try {
		const client = await connect(option);
		const connectResult = {
			code: 200,
			msg: 'connect success'
		};
		webview.postMessage({ command: 'connect', data: connectResult });
	} catch (error) {
		
		// TODO: 这边获取到的 error 不够精致，如何才能获取到更加精准的错误
		// 比如	error: Failed to spawn: `server.py`
  		//		  Caused by: No such file or directory (os error 2)

		const connectResult = {
			code: 500,
			msg: (error as any).toString()
		};
		webview.postMessage({ command: 'connect', data: connectResult });
	}
}

export function messageController(command: string, data: any, webview: VSCodeWebViewLike) {
	switch (command) {
		case 'connect':
			connectHandler(data, webview);
			break;
	
		default:
			break;
	}
}