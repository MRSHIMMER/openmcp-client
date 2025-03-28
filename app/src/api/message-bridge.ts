import { pinkLog } from '@/views/setting/util';
import { onUnmounted, ref } from 'vue';

export interface VSCodeMessage {
	command: string;
	data?: unknown;
	callbackId?: string;
}

export type MessageHandler = (message: VSCodeMessage) => void;
export const acquireVsCodeApi = (window as any)['acquireVsCodeApi'];

class MessageBridge {
	private ws: WebSocket | null = null;
	private handlers = new Set<MessageHandler>();
	public isConnected = ref(false);

	constructor(private wsUrl: string = 'ws://localhost:8080') {
		this.init();
	}

	private init() {
		// 环境检测优先级：
		// 1. VS Code WebView 环境
		// 2. 浏览器 WebSocket 环境
		if (typeof acquireVsCodeApi !== 'undefined') {
			this.setupVSCodeListener();
			pinkLog('当前模式：release');
		} else {
			this.setupWebSocket();
			pinkLog('当前模式：debug');
		}
	}

	// VS Code 环境监听
	private setupVSCodeListener() {
		const vscode = acquireVsCodeApi();

		window.addEventListener('message', (event: MessageEvent<VSCodeMessage>) => {
			this.dispatchMessage(event.data);
		});

		this.postMessage = (message) => vscode.postMessage(message);
		this.isConnected.value = true;
	}

	// WebSocket 环境连接
	private setupWebSocket() {
		this.ws = new WebSocket(this.wsUrl);

		this.ws.onopen = () => {
			this.isConnected.value = true;
		};

		this.ws.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data) as VSCodeMessage;
				this.dispatchMessage(message);
			} catch (err) {
				console.error('Message parse error:', err);
			}
		};

		this.ws.onclose = () => {
			this.isConnected.value = false;
		};

		this.postMessage = (message) => {
			if (this.ws?.readyState === WebSocket.OPEN) {
				this.ws.send(JSON.stringify(message));
			}
		};
	}

	private dispatchMessage(message: VSCodeMessage) {
		this.handlers.forEach(handler => handler(message));
	}

	public postMessage(message: VSCodeMessage) {
		throw new Error('PostMessage not initialized');
	}

	public onMessage(handler: MessageHandler) {
		this.handlers.add(handler);
		return () => this.handlers.delete(handler);
	}

	public destroy() {
		this.ws?.close();
		this.handlers.clear();
	}
}

// 单例实例
const messageBridge = new MessageBridge();

// 向外暴露一个独立函数，保证 MessageBridge 是单例的
export function useMessageBridge() {
	const bridge = messageBridge;

	onUnmounted(() => {
		bridge.destroy();
	});

	return {
		postMessage: bridge.postMessage.bind(bridge),
		onMessage: bridge.onMessage.bind(bridge),
		isConnected: bridge.isConnected
	};
}