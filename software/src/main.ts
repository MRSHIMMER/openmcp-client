import { app, BrowserWindow } from 'electron';
import WebSocket from 'ws';
import * as OpenMCPService from '../resources/service';

let mainWindow: BrowserWindow

function createWindow(): void {
	mainWindow = new BrowserWindow({
		height: 800,
		useContentSize: true,
		width: 1200,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		},
		autoHideMenuBar: true
	})

	mainWindow.loadFile('resources/renderer/index.html')
}

const wss = new (WebSocket as any).Server({ port: 8080 });

wss.on('connection', (ws: any) => {

    // 仿造 webview 进行统一接口访问
    const webview = new OpenMCPService.VSCodeWebViewLike(ws);

    // 先发送成功建立的消息
    webview.postMessage({
        command: 'hello',
        data: {
            version: '0.0.1',
            name: '消息桥连接完成'
        }
    });

    // 注册消息接受的管线
    webview.onDidReceiveMessage(message => {
        console.info(`command: [${message.command || 'No Command'}]`);

        const { command, data } = message;
        OpenMCPService.routeMessage(command, data, webview);
    });
});

app.whenReady().then(() => {
	createWindow()

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})