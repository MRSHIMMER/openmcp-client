
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
		const connectResult = {
			code: 500,
			msg: error
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